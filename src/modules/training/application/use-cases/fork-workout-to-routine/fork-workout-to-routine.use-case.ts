import { Exercise } from '../../../domain/entities/exercise.entity';
import { Routine } from '../../../domain/entities/routine.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import {
  RoutineDay,
  isValidDayOfWeek,
  MAX_EXERCISES_PER_DAY,
} from '../../../domain/value-objects/routine-day.value-object';
import { RoutineExerciseSet } from '../../../domain/value-objects/routine-exercise-set.value-object';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ForkExerciseOverride {
  sourceExerciseId: string;
  sets?: number;
  repsPerSet?: number;
  weight?: number;
}

export interface ForkWorkoutInput {
  routineId: string;
  dayOfWeek: string;
  sourceWorkoutSessionId: string;
  exercises?: ForkExerciseOverride[];
}

export interface ForkWorkoutOutput {
  routineId: string;
  dayOfWeek: string;
  exercisesAdded: number;
}

export class ForkWorkoutToRoutineUseCase {
  constructor(
    private readonly routineRepository: RoutineRepository,
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: ForkWorkoutInput,
  ): Promise<ForkWorkoutOutput> {
    const routine = await this.findRoutineOrThrow(
      input.routineId,
      actor.userId,
    );
    const session = await this.findSessionOrThrow(input.sourceWorkoutSessionId);
    this.validateDayOfWeek(input.dayOfWeek);

    const overrideMap = this.buildOverrideMap(input.exercises);
    const overrideDefaultSets =
      input.exercises != null && input.exercises.length > 0;

    const { forkedExercises, exercisesAdded } = this.forkSessionExercises(
      session,
      overrideMap,
      overrideDefaultSets,
    );

    if (exercisesAdded === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        'No exercises to fork from the workout session',
        {},
      );
    }

    const updatedRoutine = this.addForkedExercisesToRoutine(
      routine,
      input.dayOfWeek,
      forkedExercises,
    );

    await this.routineRepository.save(updatedRoutine);

    return {
      routineId: input.routineId,
      dayOfWeek: input.dayOfWeek,
      exercisesAdded,
    };
  }

  private async findRoutineOrThrow(
    routineId: string,
    userId: string,
  ): Promise<Routine> {
    const routine = await this.routineRepository.findByIdAndUserId(
      routineId,
      userId,
    );
    if (!routine) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${routineId}" not found`,
        { routineId },
      );
    }
    return routine;
  }

  private async findSessionOrThrow(sessionId: string): Promise<WorkoutSession> {
    const session = await this.workoutSessionRepository.findById(sessionId);
    if (!session) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAY_INVALID_DAY_OF_WEEK,
        `Workout session with id "${sessionId}" not found`,
        { sessionId },
      );
    }
    return session;
  }

  private validateDayOfWeek(dayOfWeek: string): void {
    if (!isValidDayOfWeek(dayOfWeek)) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAY_INVALID_DAY_OF_WEEK,
        `Invalid day of week: ${dayOfWeek}`,
        { dayOfWeek },
      );
    }
  }

  private buildOverrideMap(
    exercises: ForkExerciseOverride[] | undefined,
  ): Map<string, ForkExerciseOverride> {
    const map = new Map<string, ForkExerciseOverride>();
    if (exercises) {
      for (const override of exercises) {
        map.set(override.sourceExerciseId, override);
      }
    }
    return map;
  }

  private forkSessionExercises(
    session: WorkoutSession,
    overrideMap: Map<string, ForkExerciseOverride>,
    overrideDefaultSets: boolean,
  ): { forkedExercises: Exercise[]; exercisesAdded: number } {
    const forkedExercises: Exercise[] = [];
    let exercisesAdded = 0;

    for (const we of session.exercises) {
      const exercise = this.forkSingleExercise(
        we,
        overrideMap,
        overrideDefaultSets,
        forkedExercises.length,
      );
      if (!exercise) {
        continue;
      }
      forkedExercises.push(exercise);
      exercisesAdded++;
    }

    return { forkedExercises, exercisesAdded };
  }

  private forkSingleExercise(
    we: WorkoutExercise,
    overrideMap: Map<string, ForkExerciseOverride>,
    overrideDefaultSets: boolean,
    currentForkedCount: number,
  ): Exercise | null {
    const override = overrideMap.get(we.exerciseId);
    if (overrideDefaultSets && !override) {
      return null;
    }

    const { numberOfSets, reps, weight } = this.resolveExerciseParams(
      we,
      override,
      overrideDefaultSets,
    );

    const sets = this.buildForkedSets(we, numberOfSets, reps, weight, override);

    return Exercise.reconstitute(
      crypto.randomUUID(),
      we.exerciseName,
      we.order + currentForkedCount,
      sets,
    );
  }

  private resolveExerciseParams(
    we: WorkoutExercise,
    override: ForkExerciseOverride | undefined,
    _overrideDefaultSets: boolean,
  ): { numberOfSets: number; reps: number; weight: number } {
    if (override) {
      return {
        numberOfSets: override.sets ?? we.targetSets.length,
        reps: override.repsPerSet ?? we.targetSets[0]?.reps ?? 10,
        weight: override.weight ?? we.targetSets[0]?.weight ?? 0,
      };
    }
    return {
      numberOfSets: we.targetSets.length,
      reps: we.targetSets[0]?.reps ?? 10,
      weight: we.targetSets[0]?.weight ?? 0,
    };
  }

  private buildForkedSets(
    we: WorkoutExercise,
    numberOfSets: number,
    reps: number,
    weight: number,
    override: ForkExerciseOverride | undefined,
  ): RoutineExerciseSet[] {
    const sets: RoutineExerciseSet[] = [];
    for (let i = 0; i < numberOfSets; i++) {
      const targetSet = we.targetSets[i];
      if (targetSet && !override) {
        sets.push(
          RoutineExerciseSet.create(i + 1, targetSet.reps, targetSet.weight),
        );
      } else {
        sets.push(RoutineExerciseSet.create(i + 1, reps, weight));
      }
    }
    return sets;
  }

  private addForkedExercisesToRoutine(
    routine: Routine,
    dayOfWeek: string,
    forkedExercises: Exercise[],
  ): Routine {
    const existingDay = routine.days.find((d) => d.dayOfWeek === dayOfWeek);
    if (!existingDay) {
      return this.addExercisesToNewDay(routine, dayOfWeek, forkedExercises);
    }
    return this.addExercisesToExistingDay(routine, dayOfWeek, forkedExercises);
  }

  private addExercisesToNewDay(
    routine: Routine,
    dayOfWeek: string,
    forkedExercises: Exercise[],
  ): Routine {
    const newDay = RoutineDay.create(dayOfWeek);
    const newExercisesCount = newDay.exerciseCount + forkedExercises.length;
    if (newExercisesCount > MAX_EXERCISES_PER_DAY) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_DAY_LIMIT_EXCEEDED,
        `Cannot add ${forkedExercises.length} exercises: day would exceed limit of ${MAX_EXERCISES_PER_DAY}`,
        { maxExercises: MAX_EXERCISES_PER_DAY },
      );
    }
    const dayWithExercises = forkedExercises.reduce(
      (day, ex) => day.addExercise(ex),
      newDay,
    );
    return Routine.reconstitute({
      id: routine.id,
      name: routine.name,
      userId: routine.userId,
      days: [...routine.days, dayWithExercises],
      isActive: routine.isActive,
      trainingStrategyKey: routine.trainingStrategyKey,
      targetAudience: routine.targetAudience,
      createdAt: routine.createdAt,
      updatedAt: new Date(),
    });
  }

  private addExercisesToExistingDay(
    routine: Routine,
    dayOfWeek: string,
    forkedExercises: Exercise[],
  ): Routine {
    let updated = routine;
    for (const exercise of forkedExercises) {
      updated = updated.addExerciseToDay(dayOfWeek, exercise);
    }
    return updated;
  }
}

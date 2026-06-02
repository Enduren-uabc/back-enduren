import { Exercise } from '../../../domain/entities/exercise.entity';
import { Routine } from '../../../domain/entities/routine.entity';
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
    const routine = await this.routineRepository.findByIdAndUserId(
      input.routineId,
      actor.userId,
    );
    if (!routine) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    const session = await this.workoutSessionRepository.findById(
      input.sourceWorkoutSessionId,
    );
    if (!session) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAY_INVALID_DAY_OF_WEEK,
        `Workout session with id "${input.sourceWorkoutSessionId}" not found`,
        { sessionId: input.sourceWorkoutSessionId },
      );
    }

    if (!isValidDayOfWeek(input.dayOfWeek)) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAY_INVALID_DAY_OF_WEEK,
        `Invalid day of week: ${input.dayOfWeek}`,
        { dayOfWeek: input.dayOfWeek },
      );
    }

    const overrideMap = new Map<string, ForkExerciseOverride>();
    if (input.exercises) {
      for (const override of input.exercises) {
        overrideMap.set(override.sourceExerciseId, override);
      }
    }

    let exercisesAdded = 0;
    const overrideDefaultSets = input.exercises && input.exercises.length > 0;

    const forkedExercises: Exercise[] = [];
    for (const we of session.exercises) {
      const override = overrideMap.get(we.exerciseId);

      let numberOfSets: number;
      let reps: number;
      let weight: number;

      if (override) {
        numberOfSets = override.sets ?? we.targetSets.length;
        reps = override.repsPerSet ?? we.targetSets[0]?.reps ?? 10;
        weight = override.weight ?? we.targetSets[0]?.weight ?? 0;
      } else if (overrideDefaultSets) {
        continue;
      } else {
        numberOfSets = we.targetSets.length;
        reps = we.targetSets[0]?.reps ?? 10;
        weight = we.targetSets[0]?.weight ?? 0;
      }

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

      const exercise = Exercise.reconstitute(
        crypto.randomUUID(),
        we.exerciseName,
        we.order + forkedExercises.length,
        sets,
      );
      forkedExercises.push(exercise);
      exercisesAdded++;
    }

    if (exercisesAdded === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        'No exercises to fork from the workout session',
        {},
      );
    }

    let updatedRoutine = routine;

    const existingDay = routine.days.find(
      (d) => d.dayOfWeek === input.dayOfWeek,
    );
    if (!existingDay) {
      const newDay = RoutineDay.create(input.dayOfWeek);
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
      updatedRoutine = Routine.reconstitute(
        routine.id,
        routine.name,
        routine.userId,
        [...routine.days, dayWithExercises],
        routine.isActive,
        routine.trainingStrategyKey,
        routine.createdAt,
        new Date(),
        routine.targetAudience,
      );
    } else {
      for (const exercise of forkedExercises) {
        updatedRoutine = updatedRoutine.addExerciseToDay(
          input.dayOfWeek,
          exercise,
        );
      }
    }

    await this.routineRepository.save(updatedRoutine);

    return {
      routineId: input.routineId,
      dayOfWeek: input.dayOfWeek,
      exercisesAdded,
    };
  }
}

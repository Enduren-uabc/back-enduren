import { Routine } from '../../../domain/entities/routine.entity';
import { Exercise } from '../../../domain/entities/exercise.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface AddExerciseToRoutineDayInput {
  routineId: string;
  dayOfWeek: string;
  name: string;
  order?: number;
}

export interface AddExerciseToRoutineDayOutput {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  targetAudience: 'self' | 'client';
  days: Array<{
    dayOfWeek: string;
    exercises: Array<{
      id: string;
      name: string;
      order: number;
      sets: Array<{
        id: string;
        setNumber: number;
        reps: number;
        weight: number;
        restSeconds: number | null;
      }>;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class AddExerciseToRoutineDayUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    _actor: CurrentActor,
    input: AddExerciseToRoutineDayInput,
  ): Promise<AddExerciseToRoutineDayOutput> {
    // Validate routine exists
    const routine = await this.routineRepository.findById(input.routineId);
    if (!routine) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    // Validate exercise name is non-empty (RF-10.0.3 — day selection required is enforced by route)
    if (!input.name || input.name.trim().length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.EXERCISE_NAME_REQUIRED,
        'Exercise name is required',
        { name: input.name },
      );
    }

    // Determine order: if not provided, place at end of day's exercises
    const dayOfWeek = input.dayOfWeek;
    const existingDay = routine.days.find((d) => d.dayOfWeek === dayOfWeek);
    const order =
      input.order !== undefined
        ? input.order
        : existingDay
          ? existingDay.exercises.length
          : 0;

    // Create exercise domain entity (validates name)
    const exerciseId = crypto.randomUUID();
    const exercise = Exercise.create(exerciseId, input.name, order);

    // Delegate to aggregate root — enforces day exists and max 10 exercises
    const updatedRoutine = routine.addExerciseToDay(dayOfWeek, exercise);

    const saved = await this.routineRepository.save(updatedRoutine);

    return this.mapToOutput(saved);
  }

  private mapToOutput(routine: Routine): AddExerciseToRoutineDayOutput {
    return {
      id: routine.id,
      name: routine.name,
      userId: routine.userId,
      isActive: routine.isActive,
      targetAudience: routine.targetAudience,
      days: routine.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        exercises: d.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          order: e.order,
          sets: e.sets.map((s) => ({
            id: s.id,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            restSeconds: s.restSeconds,
          })),
        })),
      })),
      createdAt: routine.createdAt,
      updatedAt: routine.updatedAt,
    };
  }
}

import { Routine } from '../../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface RemoveExerciseFromRoutineInput {
  routineId: string;
  dayOfWeek: string;
  exerciseId: string;
}

export interface RemoveExerciseFromRoutineOutput {
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

export class RemoveExerciseFromRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    _actor: CurrentActor,
    input: RemoveExerciseFromRoutineInput,
  ): Promise<RemoveExerciseFromRoutineOutput> {
    // Validate routine exists
    const routine = await this.routineRepository.findById(input.routineId);
    if (!routine) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    // Delegate to aggregate root — enforces day exists and exercise exists in day
    const updatedRoutine = routine.removeExerciseFromDay(
      input.dayOfWeek,
      input.exerciseId,
    );

    const saved = await this.routineRepository.save(updatedRoutine);

    return this.mapToOutput(saved);
  }

  private mapToOutput(routine: Routine): RemoveExerciseFromRoutineOutput {
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

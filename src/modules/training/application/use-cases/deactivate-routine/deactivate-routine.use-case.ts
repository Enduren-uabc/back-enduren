import { Routine } from '../../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export const DEACTIVATE_ROUTINE_REPOSITORY_PORT = Symbol(
  'DEACTIVATE_ROUTINE_REPOSITORY_PORT',
);

export interface DeactivateRoutineInput {
  routineId: string;
}

export interface DeactivateRoutineOutput {
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

export class DeactivateRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    actor: CurrentActor,
    input: DeactivateRoutineInput,
  ): Promise<DeactivateRoutineOutput> {
    const routine = await this.routineRepository.findById(input.routineId);

    if (routine === null) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    if (routine.userId !== actor.userId) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_OWNED,
        'Routine does not belong to the current user',
        { routineId: input.routineId, userId: actor.userId },
      );
    }

    // Idempotent: if already inactive, return unchanged
    if (!routine.isActive) {
      return this.mapToOutput(routine);
    }

    const deactivated = routine.deactivate();
    const saved = await this.routineRepository.save(deactivated);

    return this.mapToOutput(saved);
  }

  private mapToOutput(routine: Routine): DeactivateRoutineOutput {
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

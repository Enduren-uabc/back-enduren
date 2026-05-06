import { Routine } from '../../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export const ACTIVATE_ROUTINE_REPOSITORY_PORT = Symbol(
  'ACTIVATE_ROUTINE_REPOSITORY_PORT',
);

export interface ActivateRoutineInput {
  routineId: string;
}

export interface ActivateRoutineOutput {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  days: Array<{
    dayOfWeek: string;
    exercises: Array<{
      id: string;
      name: string;
      order: number;
      sets?: number | null;
      repsPerSet?: number | null;
      weight?: number | null;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class ActivateRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    actor: CurrentActor,
    input: ActivateRoutineInput,
  ): Promise<ActivateRoutineOutput> {
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

    // Idempotent: if already active, return unchanged
    if (routine.isActive) {
      return this.mapToOutput(routine);
    }

    // Enforce one-active-routine-per-user invariant:
    // Find and deactivate the currently active routine before activating the target
    const currentActive = await this.routineRepository.findActiveByUserId(
      actor.userId,
    );

    if (currentActive !== null && currentActive.id !== routine.id) {
      const deactivated = currentActive.deactivate();
      await this.routineRepository.save(deactivated);
    }

    const activated = routine.activate();
    const saved = await this.routineRepository.save(activated);

    return this.mapToOutput(saved);
  }

  private mapToOutput(routine: Routine): ActivateRoutineOutput {
    return {
      id: routine.id,
      name: routine.name,
      userId: routine.userId,
      isActive: routine.isActive,
      days: routine.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        exercises: d.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          order: e.order,
          sets: e.configuration?.sets ?? null,
          repsPerSet: e.configuration?.repsPerSet ?? null,
          weight: e.configuration?.weight ?? null,
        })),
      })),
      createdAt: routine.createdAt,
      updatedAt: routine.updatedAt,
    };
  }
}

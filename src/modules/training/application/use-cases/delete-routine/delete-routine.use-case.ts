import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { CurrentActor } from '../../ports/current-actor.port';

export interface DeleteRoutineInput {
  routineId: string;
}

export interface DeleteRoutineOutput {
  id: string;
  deleted: boolean;
}

export class DeleteRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    actor: CurrentActor,
    input: DeleteRoutineInput,
  ): Promise<DeleteRoutineOutput> {
    const routine = await this.routineRepository.findByIdAndUserId(
      input.routineId,
      actor.userId,
    );

    if (routine === null) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    // Domain invariant: cannot delete an active routine
    // User must deactivate first
    if (routine.isActive) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_IS_ACTIVE,
        'Cannot delete an active routine. Please deactivate it first before deleting.',
        { routineId: routine.id, userId: actor.userId },
      );
    }

    await this.routineRepository.delete(routine);

    return {
      id: routine.id,
      deleted: true,
    };
  }
}

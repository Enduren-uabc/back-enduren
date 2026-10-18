import { Routine } from '../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../domain/errors/routine-domain.error';
import { CurrentActor } from '../ports/current-actor.port';

export function assertCanMutateRoutine(
  actor: CurrentActor,
  routine: Routine,
): void {
  if (routine.userId !== actor.userId) {
    throw new RoutineDomainError(
      RoutineErrorCode.ROUTINE_NOT_OWNED,
      'Routine does not belong to the current user',
      { routineId: routine.id, userId: actor.userId },
    );
  }

  if (routine.targetAudience === 'client' && actor.role !== 'trainer') {
    throw new RoutineDomainError(
      RoutineErrorCode.ROUTINE_TARGET_AUDIENCE_FORBIDDEN,
      'Only trainers can modify routines for clients',
      { routineId: routine.id, role: actor.role ?? null },
    );
  }
}

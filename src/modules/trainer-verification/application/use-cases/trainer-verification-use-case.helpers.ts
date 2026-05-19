import { CurrentActor } from '../ports/current-actor.port';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../domain/errors/trainer-verification.domain-error';

export const MAX_VERIFICATION_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_VERIFICATION_ROLES = ['user', 'trainer'] as const;

export function assertTrainer(actor: CurrentActor): void {
  if (!ALLOWED_VERIFICATION_ROLES.includes(actor.role as never)) {
    throw new TrainerVerificationDomainError(
      TrainerVerificationErrorCode.NOT_TRAINER_ROLE,
      'Only authenticated users can access this operation',
    );
  }
}

export function assertAdmin(actor: CurrentActor): void {
  if (actor.role !== 'admin') {
    throw new TrainerVerificationDomainError(
      TrainerVerificationErrorCode.NOT_ADMIN_ROLE,
      'Only admin users can access this operation',
    );
  }
}

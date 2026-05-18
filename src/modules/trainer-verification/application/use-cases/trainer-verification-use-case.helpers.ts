import { CurrentActor } from '../ports/current-actor.port';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../domain/errors/trainer-verification.domain-error';

export const MAX_VERIFICATION_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_VERIFICATION_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

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

export function validateVerificationFile(file: Express.Multer.File): void {
  if (!ALLOWED_VERIFICATION_MIME_TYPES.includes(file.mimetype as never)) {
    throw new TrainerVerificationDomainError(
      TrainerVerificationErrorCode.INVALID_FILE_TYPE,
      'Only jpeg, png, webp and pdf files are allowed',
    );
  }
  if (file.size > MAX_VERIFICATION_FILE_SIZE_BYTES) {
    throw new TrainerVerificationDomainError(
      TrainerVerificationErrorCode.FILE_TOO_LARGE,
      'Verification files must be 10MB or smaller',
    );
  }
}

export function buildVerificationBlobPath(
  userId: string,
  section: 'id' | 'certificates',
  originalName: string,
): string {
  const safeName = originalName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160);
  return `verifications/${userId}/${section}/${crypto.randomUUID()}-${safeName || 'file'}`;
}


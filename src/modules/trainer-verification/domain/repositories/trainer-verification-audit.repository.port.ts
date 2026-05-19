import { TrainerVerificationAuditEvent } from '../entities/trainer-verification-audit-event.entity';
import { TrainerVerificationStatusChange } from '../entities/trainer-verification-status-change.entity';

export const TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT = Symbol(
  'TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT',
);

export interface TrainerVerificationAuditRepository {
  recordStatusChange(change: TrainerVerificationStatusChange): Promise<void>;
  recordAuditEvent(event: TrainerVerificationAuditEvent): Promise<void>;
  getStatusHistory(
    verificationId: string,
  ): Promise<TrainerVerificationStatusChange[]>;
  getAuditEvents(
    verificationId: string,
    eventType?: string,
  ): Promise<TrainerVerificationAuditEvent[]>;
}

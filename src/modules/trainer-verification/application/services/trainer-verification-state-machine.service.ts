import { AdvancedVerificationStatus } from '../../domain/value-objects/advanced-verification-status.vo';
import { advancedToLegacy } from '../../domain/value-objects/advanced-to-legacy-mapper';
import { TrainerVerificationStatusChange } from '../../domain/entities/trainer-verification-status-change.entity';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../domain/errors/trainer-verification.domain-error';
import { TrainerVerification } from '../../domain/entities/trainer-verification.entity';

export interface TransitionActor {
  actorId: string;
  actorType: 'user' | 'system' | 'admin' | 'external_service';
}

export class TrainerVerificationStateMachineService {
  private readonly allowedTransitions: Record<
    AdvancedVerificationStatus,
    AdvancedVerificationStatus[]
  > = {
    draft: ['certificate_uploaded', 'id_uploaded', 'cancelled_by_user'],
    certificate_uploaded: [
      'certificate_extraction_pending',
      'certificate_extraction_failed',
      'id_uploaded',
    ],
    certificate_extraction_pending: [
      'certificate_extracted',
      'certificate_extraction_failed',
    ],
    certificate_extracted: ['id_uploaded', 'identity_compared'],
    certificate_extraction_failed: [
      'certificate_uploaded',
      'manual_review_pending',
    ],
    id_uploaded: [
      'id_extraction_pending',
      'id_extraction_failed',
      'manual_review_pending',
    ],
    id_extraction_pending: ['id_extracted', 'id_extraction_failed'],
    id_extracted: ['identity_compared', 'manual_review_pending'],
    id_extraction_failed: ['id_uploaded', 'manual_review_pending'],
    identity_compared: ['risk_calculated', 'manual_review_pending'],
    risk_calculated: ['manual_review_pending', 'blocked_for_risk'],
    manual_review_pending: ['manual_review_in_progress'],
    manual_review_in_progress: ['approved', 'rejected', 'correction_required'],
    correction_required: ['draft', 'cancelled_by_user'],
    approved: [],
    rejected: [],
    cancelled_by_user: [],
    expired: [],
    blocked_for_risk: ['manual_review_pending'],
  };

  canTransition(
    from: AdvancedVerificationStatus,
    to: AdvancedVerificationStatus,
  ): boolean {
    const allowed = this.allowedTransitions[from];
    return allowed.includes(to);
  }

  transition(
    verification: TrainerVerification,
    to: AdvancedVerificationStatus,
    actor: TransitionActor,
    reason?: string,
  ): TrainerVerificationStatusChange {
    const from = verification.advancedStatus ?? 'draft';

    if (!this.canTransition(from, to)) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_STATUS_TRANSITION,
        `Cannot transition from ${from} to ${to}`,
      );
    }

    const change = TrainerVerificationStatusChange.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      previousStatus: from,
      newStatus: to,
      actorId: actor.actorId,
      actorType: actor.actorType,
      reason,
      createdAt: new Date(),
    });

    verification.applyAdvancedStatusTransition(to, change);

    return change;
  }

  deriveLegacyStatus(
    advancedStatus: AdvancedVerificationStatus,
  ): import('../../domain/value-objects/verification-status.vo').VerificationStatus {
    return advancedToLegacy(advancedStatus);
  }
}

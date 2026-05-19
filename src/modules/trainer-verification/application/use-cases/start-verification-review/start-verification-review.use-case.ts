import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import {
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';
import {
  TrainerVerificationAuditRepository,
  TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification-audit.repository.port';
import { TrainerVerificationStateMachineService } from '../../services/trainer-verification-state-machine.service';
import { TrainerVerificationAuditEvent } from '../../../domain/entities/trainer-verification-audit-event.entity';
import { assertAdmin } from '../trainer-verification-use-case.helpers';

export interface StartVerificationReviewInput {
  actor: CurrentActor;
  verificationId: string;
}

export interface StartVerificationReviewOutput {
  verificationId: string;
  advancedStatus: string;
  assignedReviewerId: string;
}

@Injectable()
export class StartVerificationReviewUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
  ) {}

  async execute(
    input: StartVerificationReviewInput,
  ): Promise<StartVerificationReviewOutput> {
    assertAdmin(input.actor);

    const verification = await this.verificationRepository.findById(
      input.verificationId,
    );
    if (!verification) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'Trainer verification was not found',
      );
    }

    if (verification.advancedStatus !== 'manual_review_pending') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_STATUS_TRANSITION,
        `Cannot start review. Current status: ${verification.advancedStatus}. Expected: manual_review_pending`,
      );
    }

    verification.assignReviewer(input.actor.userId);

    const change = this.stateMachine.transition(
      verification,
      'manual_review_in_progress',
      { actorId: input.actor.userId, actorType: 'admin' },
      'Review started by administrator',
    );

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'admin_access',
      actorId: input.actor.userId,
      actorType: 'admin',
      description: 'Administrator started review of verification',
      metadata: { action: 'start_review' },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);
    await this.auditRepository.recordAuditEvent(auditEvent);

    return {
      verificationId: verification.id,
      advancedStatus: 'manual_review_in_progress',
      assignedReviewerId: input.actor.userId,
    };
  }
}

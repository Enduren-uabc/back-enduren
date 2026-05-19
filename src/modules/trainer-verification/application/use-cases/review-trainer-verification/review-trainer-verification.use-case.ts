import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
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
import {
  TRAINER_FLOW_CONFIG_PORT,
  TrainerFlowConfigPort,
} from '../../ports/trainer-flow-config.port';
import { assertAdmin } from '../trainer-verification-use-case.helpers';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import { AdvancedVerificationStatus } from '../../../domain/value-objects/advanced-verification-status.vo';

export interface ReviewTrainerVerificationInput {
  actor: CurrentActor;
  verificationId: string;
  decision: 'approved' | 'rejected' | 'correction_required';
  rejectionReason?: string;
  internalComment?: string;
  userVisibleMessage?: string;
  correctionType?: 'certificate' | 'id_document' | 'liveness' | 'other';
}

export interface ReviewTrainerVerificationOutput {
  verificationId: string;
  decision: string;
  legacyStatus: string;
  advancedStatus?: string;
}

@Injectable()
export class ReviewTrainerVerificationUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
    @Inject(TRAINER_FLOW_CONFIG_PORT)
    private readonly flowConfig: TrainerFlowConfigPort,
  ) {}

  async execute(
    input: ReviewTrainerVerificationInput,
  ): Promise<ReviewTrainerVerificationOutput> {
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

    const isPowerspike = this.flowConfig.isPowerspikeEnabled();

    if (isPowerspike) {
      return this.executePowerspike(input, verification);
    }

    return this.executeLegacy(input, verification);
  }

  private async executePowerspike(
    input: ReviewTrainerVerificationInput,
    verification: TrainerVerification,
  ): Promise<ReviewTrainerVerificationOutput> {
    const advancedStatus = verification.advancedStatus ?? 'draft';

    if (advancedStatus !== 'manual_review_in_progress') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_STATUS_TRANSITION,
        `Cannot review in status: ${advancedStatus}`,
      );
    }

    if (verification.assignedReviewerId !== input.actor.userId) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.NOT_ASSIGNED_TO_YOU,
        'This verification is assigned to another reviewer',
      );
    }

    if (input.decision === 'correction_required' && !input.userVisibleMessage) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.CORRECTION_MESSAGE_REQUIRED,
        'A user-visible message is required when requesting correction',
      );
    }

    const decisionMap: Record<string, AdvancedVerificationStatus> = {
      approved: 'approved',
      rejected: 'rejected',
      correction_required: 'correction_required',
    };
    const targetStatus = decisionMap[input.decision];

    const change = this.stateMachine.transition(
      verification,
      targetStatus,
      { actorId: input.actor.userId, actorType: 'admin' },
      input.internalComment ?? `Decision: ${input.decision}`,
    );

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'admin_decision',
      actorId: input.actor.userId,
      actorType: 'admin',
      description: `Administrator ${input.decision} the verification`,
      metadata: {
        decision: input.decision,
        internalComment: input.internalComment,
        userVisibleMessage: input.userVisibleMessage,
        correctionType: input.correctionType,
      },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);
    await this.auditRepository.recordAuditEvent(auditEvent);

    if (input.decision === 'approved') {
      const trainer = await this.userRepository.findById(verification.userId);
      if (trainer && trainer.role !== 'trainer') {
        trainer.upgradeToTrainer();
        await this.userRepository.save(trainer);
      }
    }

    return {
      verificationId: verification.id,
      decision: input.decision,
      legacyStatus: verification.verificationStatus,
      advancedStatus: verification.advancedStatus,
    };
  }

  private async executeLegacy(
    input: ReviewTrainerVerificationInput,
    verification: TrainerVerification,
  ): Promise<ReviewTrainerVerificationOutput> {
    if (input.decision === 'correction_required') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_STATUS_TRANSITION,
        'Correction request is not supported for this verification type',
      );
    }

    const trainer = await this.userRepository.findById(verification.userId);
    if (!trainer) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.NOT_TRAINER_ROLE,
        'User not found for this verification',
      );
    }

    if (input.decision === 'approved') {
      if (trainer.role !== 'trainer') {
        trainer.upgradeToTrainer();
        await this.userRepository.save(trainer);
      }
      verification.approve(input.actor.userId);
    } else {
      verification.reject(input.actor.userId, input.rejectionReason ?? '');
    }

    const saved = await this.verificationRepository.save(verification);
    return {
      verificationId: saved.id,
      decision: input.decision,
      legacyStatus: saved.verificationStatus,
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import { TrainerVerificationAuditEvent } from '../../../domain/entities/trainer-verification-audit-event.entity';
import {
  TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
  TrainerVerificationAuditRepository,
} from '../../../domain/repositories/trainer-verification-audit.repository.port';
import {
  TRAINER_VERIFICATION_REPOSITORY_PORT,
  TrainerVerificationRepository,
} from '../../../domain/repositories/trainer-verification.repository.port';
import {
  SpecialtyCatalogRepository,
  SPECIALTY_CATALOG_REPOSITORY_PORT,
} from '../../../domain/repositories/specialty-catalog.repository.port';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import {
  TrainerVerificationStateMachineService,
  TransitionActor,
} from '../../services/trainer-verification-state-machine.service';
import { assertTrainer } from '../trainer-verification-use-case.helpers';

export interface SubmitPowerspikeVerificationInput {
  actor: CurrentActor;
  specialtyKeys: string[];
  yearsOfExperience: number;
  shortBio: string;
  idDocumentNumber: string;
}

export interface SubmitPowerspikeVerificationOutput {
  verificationId: string;
  advancedStatus: 'manual_review_pending';
  legacyStatus: 'pending';
}

@Injectable()
export class SubmitPowerspikeVerificationUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    @Inject(SPECIALTY_CATALOG_REPOSITORY_PORT)
    private readonly specialtyCatalogRepository: SpecialtyCatalogRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
  ) {}

  async execute(
    input: SubmitPowerspikeVerificationInput,
  ): Promise<SubmitPowerspikeVerificationOutput> {
    assertTrainer(input.actor);

    const verification = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );
    if (!verification) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'No trainer verification found. Complete the previous steps first.',
      );
    }

    const allowedStatuses: string[] = ['id_extracted', 'id_extraction_failed'];
    if (!allowedStatuses.includes(verification.advancedStatus ?? '')) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_STATUS_TRANSITION,
        `Cannot submit in current status: ${verification.advancedStatus}. Complete ID extraction first.`,
      );
    }

    const uniqueKeys = [...new Set(input.specialtyKeys)];
    const specialties =
      await this.specialtyCatalogRepository.findByKeys(uniqueKeys);
    if (specialties.length !== uniqueKeys.length) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_SPECIALTY_KEY,
        'One or more specialty keys do not exist',
      );
    }

    const wasIdExtractionFailed =
      verification.advancedStatus === 'id_extraction_failed';

    verification.specialtyKeys = uniqueKeys;
    verification.yearsOfExperience = input.yearsOfExperience;
    verification.shortBio = input.shortBio.trim();
    verification.idDocumentNumber = input.idDocumentNumber.trim();

    const transitionActor: TransitionActor = {
      actorId: input.actor.userId,
      actorType: 'user',
    };

    const change = this.stateMachine.transition(
      verification,
      'manual_review_pending',
      transitionActor,
      'Powerspike verification submitted for manual review',
    );

    if (wasIdExtractionFailed) {
      const extractionFailedAlert = TrainerVerificationAuditEvent.create({
        id: crypto.randomUUID(),
        verificationId: verification.id,
        eventType: 'extraction_failed',
        actorId: input.actor.userId,
        actorType: 'system',
        description:
          'Submission with failed ID extraction — manual review required',
        metadata: { idExtractionFailed: true },
        createdAt: new Date(),
      });
      await this.auditRepository.recordAuditEvent(extractionFailedAlert);
    }

    const submitAuditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'document_uploaded',
      actorId: input.actor.userId,
      actorType: 'user',
      description: 'Powerspike verification submitted for manual review',
      metadata: {
        specialtyKeys: input.specialtyKeys,
        yearsOfExperience: input.yearsOfExperience,
      },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);
    await this.auditRepository.recordAuditEvent(submitAuditEvent);

    return {
      verificationId: verification.id,
      advancedStatus: 'manual_review_pending',
      legacyStatus: 'pending',
    };
  }
}

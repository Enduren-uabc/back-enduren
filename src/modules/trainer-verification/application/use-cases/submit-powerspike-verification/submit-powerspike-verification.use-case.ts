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
import { RiskScoringService } from '../../services/risk-scoring.service';
import { assertTrainer } from '../trainer-verification-use-case.helpers';

export interface SubmitPowerspikeVerificationInput {
  actor: CurrentActor;
  specialtyKeys: string[];
  yearsOfExperience: number;
  shortBio: string;
  idDocumentNumber?: string;
}

export interface SubmitPowerspikeVerificationOutput {
  verificationId: string;
  advancedStatus: string;
  legacyStatus: 'pending';
  riskLevel?: string;
  riskScore?: number;
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
    private readonly riskScoring: RiskScoringService,
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

    const idNumber =
      input.idDocumentNumber?.trim() ||
      verification.extractedIdData?.documentIdentifier?.trim();

    if (!idNumber) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.ID_DOCUMENT_NUMBER_REQUIRED,
        'ID document number is required when extraction fails',
      );
    }

    verification.idDocumentNumber = idNumber;

    const systemActor: TransitionActor = {
      actorId: 'system',
      actorType: 'system',
    };

    const userActor: TransitionActor = {
      actorId: input.actor.userId,
      actorType: 'user',
    };

    let comparisonChange;
    if (verification.advancedStatus === 'id_extracted') {
      comparisonChange = this.stateMachine.transition(
        verification,
        'identity_compared',
        systemActor,
        'Identity comparison computed via scoring',
      );
    }

    const scoringResult = this.riskScoring.calculate({
      certificateData: verification.extractedCertificateData,
      idData: verification.extractedIdData,
      idExtractionFailed: wasIdExtractionFailed,
    });

    verification.assignScoringResult(scoringResult);

    this.stateMachine.transition(
      verification,
      'risk_calculated',
      systemActor,
      `Risk scoring completed: ${scoringResult.riskLevel} (${scoringResult.riskScore}/100)`,
    );

    const isCritical = scoringResult.riskLevel === 'critical';
    const finalChange = this.stateMachine.transition(
      verification,
      isCritical ? 'blocked_for_risk' : 'manual_review_pending',
      userActor,
      isCritical
        ? 'Blocked due to critical risk level'
        : 'Powerspike verification submitted for manual review',
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

    const scoringAuditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'risk_calculated',
      actorId: 'system',
      actorType: 'system',
      description: `Risk scoring: ${scoringResult.riskLevel} (${scoringResult.riskScore}/100) — ${scoringResult.alerts.length} alerts`,
      metadata: {
        riskScore: scoringResult.riskScore,
        riskLevel: scoringResult.riskLevel,
        alertCount: scoringResult.alerts.length,
        alerts: scoringResult.alerts.map((a) => a.code),
      },
      createdAt: new Date(),
    });

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
    if (comparisonChange) {
      await this.auditRepository.recordStatusChange(comparisonChange);
    }
    await this.auditRepository.recordStatusChange(finalChange);
    await this.auditRepository.recordAuditEvent(scoringAuditEvent);
    await this.auditRepository.recordAuditEvent(submitAuditEvent);

    return {
      verificationId: verification.id,
      advancedStatus: verification.advancedStatus ?? 'manual_review_pending',
      legacyStatus: 'pending',
      riskLevel: scoringResult.riskLevel,
      riskScore: scoringResult.riskScore,
    };
  }
}

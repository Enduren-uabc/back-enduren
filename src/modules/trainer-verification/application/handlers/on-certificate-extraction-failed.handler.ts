import { Inject, Injectable } from '@nestjs/common';
import { CertificateExtractionFailedEvent } from '../events/certificate-extraction-failed.event';
import { TrainerVerificationAuditEvent } from '../../domain/entities/trainer-verification-audit-event.entity';
import {
  TRAINER_VERIFICATION_REPOSITORY_PORT,
  TrainerVerificationRepository,
} from '../../domain/repositories/trainer-verification.repository.port';
import {
  TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
  TrainerVerificationAuditRepository,
} from '../../domain/repositories/trainer-verification-audit.repository.port';
import { TrainerVerificationStateMachineService } from '../services/trainer-verification-state-machine.service';
import { SYSTEM_ACTOR } from '../constants/system-actor';

@Injectable()
export class OnCertificateExtractionFailedHandler {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
  ) {}

  async handle(event: CertificateExtractionFailedEvent): Promise<void> {
    const verification = await this.verificationRepository.findById(
      event.verificationId,
    );
    if (!verification) return;

    const change = this.stateMachine.transition(
      verification,
      'certificate_extraction_failed',
      SYSTEM_ACTOR,
      `Certificate extraction failed: ${event.errorMessage}`,
    );

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'extraction_failed',
      actorId: event.userId,
      actorType: 'system',
      description: `Certificate extraction failed: ${event.errorCode} — ${event.errorMessage}`,
      metadata: {
        errorCode: event.errorCode,
        errorMessage: event.errorMessage,
      },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);
    await this.auditRepository.recordAuditEvent(auditEvent);
  }
}

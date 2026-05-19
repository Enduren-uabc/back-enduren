import { Inject, Injectable } from '@nestjs/common';
import { CertificateExtractedEvent } from '../events/certificate-extracted.event';
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
export class OnCertificateExtractedHandler {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
  ) {}

  async handle(event: CertificateExtractedEvent): Promise<void> {
    const verification = await this.verificationRepository.findById(
      event.verificationId,
    );
    if (!verification) return;

    verification.assignExtractedCertificateData(event.extractedData);

    const change = this.stateMachine.transition(
      verification,
      'certificate_extracted',
      SYSTEM_ACTOR,
      'Document extraction completed for certificate',
    );

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'document_extracted',
      actorId: event.userId,
      actorType: 'system',
      description: 'Certificate extracted successfully',
      metadata: {
        ocrConfidence: event.extractedData.ocrConfidence,
        certificateName: event.extractedData.certificateName,
      },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);
    await this.auditRepository.recordAuditEvent(auditEvent);
  }
}

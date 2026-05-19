import { Inject, Injectable } from '@nestjs/common';
import { IdDocumentExtractedEvent } from '../events/id-document-extracted.event';
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

@Injectable()
export class OnIdDocumentExtractedHandler {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
  ) {}

  async handle(event: IdDocumentExtractedEvent): Promise<void> {
    const verification = await this.verificationRepository.findById(
      event.verificationId,
    );
    if (!verification) return;

    verification.assignExtractedIdData(event.extractedData);

    const change = this.stateMachine.transition(
      verification,
      'id_extracted',
      { actorId: 'system', actorType: 'system' },
      'Document extraction completed for ID document',
    );

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'document_extracted',
      actorId: event.userId,
      actorType: 'system',
      description: 'ID document extracted successfully',
      metadata: {
        ocrConfidence: event.extractedData.ocrConfidence,
        documentType: event.extractedData.documentType,
      },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);
    await this.auditRepository.recordAuditEvent(auditEvent);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { IdDocumentExtractionFailedEvent } from '../events/id-document-extraction-failed.event';
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
export class OnIdDocumentExtractionFailedHandler {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
  ) {}

  async handle(event: IdDocumentExtractionFailedEvent): Promise<void> {
    const verification = await this.verificationRepository.findById(
      event.verificationId,
    );
    if (!verification) return;

    const change = this.stateMachine.transition(
      verification,
      'id_extraction_failed',
      { actorId: 'system', actorType: 'system' },
      `ID document extraction failed: ${event.errorMessage}`,
    );

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'extraction_failed',
      actorId: event.userId,
      actorType: 'system',
      description: `ID document extraction failed: ${event.errorCode} — ${event.errorMessage}`,
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

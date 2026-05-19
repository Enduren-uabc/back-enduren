import { Inject, Injectable } from '@nestjs/common';
import { TrainerCertificate } from '../../../domain/entities/trainer-certificate.entity';
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
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import { CurrentActor } from '../../ports/current-actor.port';
import { assertTrainer } from '../trainer-verification-use-case.helpers';

export interface ConfirmCertificateDataInput {
  actor: CurrentActor;
  certificateName: string;
  issuingOrganization: string;
}

export interface ConfirmCertificateDataOutput {
  verificationId: string;
  advancedStatus: string;
}

@Injectable()
export class ConfirmCertificateDataUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
  ) {}

  async execute(
    input: ConfirmCertificateDataInput,
  ): Promise<ConfirmCertificateDataOutput> {
    assertTrainer(input.actor);

    const verification = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );
    if (!verification) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'No trainer verification found.',
      );
    }

    if (verification.certificates.length === 0) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'No certificate found to confirm.',
      );
    }

    const originalCertificate = verification.certificates[0];

    const updatedCertificate = TrainerCertificate.reconstitute({
      id: originalCertificate.id,
      name: input.certificateName,
      issuingOrganization: input.issuingOrganization,
      containerName: originalCertificate.containerName,
      documentUrl: originalCertificate.documentUrl,
      fileName: originalCertificate.fileName,
      fileSize: originalCertificate.fileSize,
      uploadedAt: originalCertificate.uploadedAt,
    });

    verification.certificates[0] = updatedCertificate;

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'certificate_data_confirmed',
      actorId: input.actor.userId,
      actorType: 'user',
      description: `Certificate data confirmed by user`,
      metadata: {
        certificateName: input.certificateName,
        issuingOrganization: input.issuingOrganization,
      },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordAuditEvent(auditEvent);

    return {
      verificationId: verification.id,
      advancedStatus: verification.advancedStatus ?? '',
    };
  }
}

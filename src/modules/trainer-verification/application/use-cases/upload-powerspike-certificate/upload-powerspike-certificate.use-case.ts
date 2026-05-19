import { Inject, Injectable } from '@nestjs/common';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import { UploadFileOutput } from '../../../../../shared/storage/domain/ports/file-storage.port';
import { CurrentActor } from '../../ports/current-actor.port';
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
import {
  TrainerVerificationStateMachineService,
  TransitionActor,
} from '../../services/trainer-verification-state-machine.service';
import { InMemoryCommandBus } from '../../../infrastructure/cqrs/in-memory-command-bus';
import { ExtractCertificateCommand } from '../../commands/extract-certificate.command';
import { assertTrainer } from '../trainer-verification-use-case.helpers';
import { SYSTEM_ACTOR } from '../../constants/system-actor';

export interface UploadPowerspikeCertificateInput {
  actor: CurrentActor;
  certificateName?: string;
  issuingOrganization?: string;
  file: Express.Multer.File;
}

export interface UploadPowerspikeCertificateOutput {
  verificationId: string;
  advancedStatus: 'certificate_extraction_pending';
}

@Injectable()
export class UploadPowerspikeCertificateUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    private readonly stateMachine: TrainerVerificationStateMachineService,
    private readonly storageService: StorageService,
    private readonly commandBus: InMemoryCommandBus,
  ) {}

  async execute(
    input: UploadPowerspikeCertificateInput,
  ): Promise<UploadPowerspikeCertificateOutput> {
    assertTrainer(input.actor);

    const verification = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );
    if (!verification) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'No trainer verification found. Create a draft first.',
      );
    }

    if (verification.advancedStatus !== 'draft') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_STATUS_TRANSITION,
        `Cannot upload certificate in current status: ${verification.advancedStatus}`,
      );
    }

    let uploadOutput: UploadFileOutput;
    try {
      uploadOutput = await this.storageService.uploadFile(
        input.actor.userId,
        'certificates',
        input.file,
      );
    } catch {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.FILE_UPLOAD_FAILED,
        'Certificate file upload failed',
      );
    }

    const certificate = TrainerCertificate.create(
      crypto.randomUUID(),
      input.certificateName ?? 'Pendiente de extracción',
      input.issuingOrganization ?? 'Pendiente',
      uploadOutput.containerName,
      uploadOutput.blobPath,
      uploadOutput.fileName,
      uploadOutput.fileSize,
    );

    verification.certificates.push(certificate);

    const transitionActor: TransitionActor = {
      actorId: input.actor.userId,
      actorType: 'user',
    };

    const change = this.stateMachine.transition(
      verification,
      'certificate_uploaded',
      transitionActor,
      'Certificate uploaded via Powerspike flow',
    );

    const extractionPendingChange = this.stateMachine.transition(
      verification,
      'certificate_extraction_pending',
      SYSTEM_ACTOR,
      'Certificate extraction queued',
    );

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'document_uploaded',
      actorId: input.actor.userId,
      actorType: 'user',
      description: `Certificate "${input.certificateName}" uploaded`,
      metadata: {
        certificateName: input.certificateName,
        fileName: input.file.originalname,
      },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);
    await this.auditRepository.recordStatusChange(extractionPendingChange);
    await this.auditRepository.recordAuditEvent(auditEvent);

    this.commandBus.publish(
      new ExtractCertificateCommand(
        verification.id,
        input.actor.userId,
        input.file.buffer,
        input.file.mimetype,
        input.file.originalname,
      ),
    );

    return {
      verificationId: verification.id,
      advancedStatus: 'certificate_extraction_pending',
    };
  }
}

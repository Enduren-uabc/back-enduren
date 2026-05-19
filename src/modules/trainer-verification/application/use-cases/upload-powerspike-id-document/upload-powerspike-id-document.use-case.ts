import { Inject, Injectable } from '@nestjs/common';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import { UploadFileOutput } from '../../../../../shared/storage/domain/ports/file-storage.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { TrainerIdDocument } from '../../../domain/entities/trainer-id-document.entity';
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
import { ExtractIdDocumentCommand } from '../../commands/extract-id-document.command';
import { isDocumentType } from '../../../domain/value-objects/document-type.vo';
import { assertTrainer } from '../trainer-verification-use-case.helpers';
import { SYSTEM_ACTOR } from '../../constants/system-actor';

export interface UploadPowerspikeIdDocumentInput {
  actor: CurrentActor;
  idDocumentType: string;
  file: Express.Multer.File;
}

export interface UploadPowerspikeIdDocumentOutput {
  verificationId: string;
  advancedStatus: 'id_extraction_pending';
}

@Injectable()
export class UploadPowerspikeIdDocumentUseCase {
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
    input: UploadPowerspikeIdDocumentInput,
  ): Promise<UploadPowerspikeIdDocumentOutput> {
    assertTrainer(input.actor);

    const verification = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );
    if (!verification) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'No trainer verification found. Upload certificate first.',
      );
    }

    if (verification.advancedStatus !== 'certificate_extracted') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_STATUS_TRANSITION,
        `Cannot upload ID document in current status: ${verification.advancedStatus}. Certificate extraction must complete first.`,
      );
    }

    let uploadOutput: UploadFileOutput;
    try {
      uploadOutput = await this.storageService.uploadFile(
        input.actor.userId,
        'id',
        input.file,
      );
    } catch {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.FILE_UPLOAD_FAILED,
        'ID document file upload failed',
      );
    }

    const documentType = isDocumentType(input.idDocumentType)
      ? input.idDocumentType
      : 'other';

    const idDocument = TrainerIdDocument.create(
      crypto.randomUUID(),
      documentType,
      uploadOutput.containerName,
      uploadOutput.blobPath,
      uploadOutput.fileName,
      uploadOutput.fileSize,
    );

    verification.idDocuments.push(idDocument);

    const transitionActor: TransitionActor = {
      actorId: input.actor.userId,
      actorType: 'user',
    };

    const change = this.stateMachine.transition(
      verification,
      'id_uploaded',
      transitionActor,
      'ID document uploaded via Powerspike flow',
    );

    const extractionPendingChange = this.stateMachine.transition(
      verification,
      'id_extraction_pending',
      SYSTEM_ACTOR,
      'ID document extraction queued',
    );

    const auditEvent = TrainerVerificationAuditEvent.create({
      id: crypto.randomUUID(),
      verificationId: verification.id,
      eventType: 'document_uploaded',
      actorId: input.actor.userId,
      actorType: 'user',
      description: `ID document of type "${documentType}" uploaded`,
      metadata: {
        documentType,
        fileName: input.file.originalname,
      },
      createdAt: new Date(),
    });

    await this.verificationRepository.save(verification);
    await this.auditRepository.recordStatusChange(change);
    await this.auditRepository.recordStatusChange(extractionPendingChange);
    await this.auditRepository.recordAuditEvent(auditEvent);

    this.commandBus.publish(
      new ExtractIdDocumentCommand(
        verification.id,
        input.actor.userId,
        input.file.buffer,
        input.file.mimetype,
        input.file.originalname,
      ),
    );

    return {
      verificationId: verification.id,
      advancedStatus: 'id_extraction_pending',
    };
  }
}

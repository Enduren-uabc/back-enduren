import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import { UploadFileOutput } from '../../../../../shared/storage/domain/ports/file-storage.port';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  TRAINER_FLOW_CONFIG_PORT,
  TrainerFlowConfigPort,
} from '../../ports/trainer-flow-config.port';
import { TrainerCertificate } from '../../../domain/entities/trainer-certificate.entity';
import { TrainerIdDocument } from '../../../domain/entities/trainer-id-document.entity';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import { isDocumentType } from '../../../domain/value-objects/document-type.vo';
import {
  SpecialtyCatalogRepository,
  SPECIALTY_CATALOG_REPOSITORY_PORT,
} from '../../../domain/repositories/specialty-catalog.repository.port';
import {
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';
import {
  TrainerVerificationAuditRepository,
  TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification-audit.repository.port';
import { TrainerVerificationStateMachineService } from '../../services/trainer-verification-state-machine.service';
import { assertTrainer } from '../trainer-verification-use-case.helpers';
import { TrainerVerificationSubmittedEvent } from '../../../../shared/email/domain/events/trainer-verification-submitted.event';

export interface SubmitTrainerCertificateInput {
  name: string;
  issuingOrganization: string;
  documentFile: Express.Multer.File;
}

export interface SubmitTrainerVerificationInput {
  actor: CurrentActor;
  specialtyKeys: string[];
  yearsOfExperience: number;
  shortBio: string;
  idDocumentNumber: string;
  idDocumentFiles: {
    documentType: string;
    file: Express.Multer.File;
  }[];
  certificates: SubmitTrainerCertificateInput[];
}

export interface SubmitTrainerVerificationOutput {
  verificationId: string;
  status: 'pending';
}

@Injectable()
export class SubmitTrainerVerificationUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT)
    private readonly auditRepository: TrainerVerificationAuditRepository,
    @Inject(SPECIALTY_CATALOG_REPOSITORY_PORT)
    private readonly specialtyCatalogRepository: SpecialtyCatalogRepository,
    private readonly storageService: StorageService,
    @Inject(TRAINER_FLOW_CONFIG_PORT)
    private readonly flowConfig: TrainerFlowConfigPort,
    private readonly stateMachine: TrainerVerificationStateMachineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: SubmitTrainerVerificationInput,
  ): Promise<SubmitTrainerVerificationOutput> {
    assertTrainer(input.actor);

    const existing = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );

    if (this.flowConfig.isPowerspikeEnabled()) {
      if (existing) {
        if (existing.advancedStatus === 'draft') {
          return {
            verificationId: existing.id,
            status: 'pending',
          };
        }
        throw new TrainerVerificationDomainError(
          TrainerVerificationErrorCode.VERIFICATION_ALREADY_EXISTS,
          'Trainer verification already exists. Use update when it has been rejected.',
        );
      }

      const verification = TrainerVerification.createDraft(
        crypto.randomUUID(),
        input.actor.userId,
        {
          specialtyKeys: input.specialtyKeys,
          yearsOfExperience: input.yearsOfExperience,
          shortBio: input.shortBio,
        },
      );

      await this.verificationRepository.save(verification);

      return {
        verificationId: verification.id,
        status: 'pending',
      };
    }

    if (existing) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_ALREADY_EXISTS,
        'Trainer verification already exists. Use update when it has been rejected.',
      );
    }

    await this.assertSpecialtiesExist(input.specialtyKeys);

    const uploaded: UploadFileOutput[] = [];
    try {
      const idDocuments = await Promise.all(
        input.idDocumentFiles.map(async ({ documentType, file }) => {
          const output = await this.uploadFile(input.actor.userId, 'id', file);
          uploaded.push(output);
          return TrainerIdDocument.create(
            crypto.randomUUID(),
            isDocumentType(documentType) ? documentType : 'other',
            output.containerName,
            output.blobPath,
            output.fileName,
            output.fileSize,
          );
        }),
      );

      const certificates = await Promise.all(
        input.certificates.map(async (certificate) => {
          const output = await this.uploadFile(
            input.actor.userId,
            'certificates',
            certificate.documentFile,
          );
          uploaded.push(output);
          return TrainerCertificate.create(
            crypto.randomUUID(),
            certificate.name,
            certificate.issuingOrganization,
            output.containerName,
            output.blobPath,
            output.fileName,
            output.fileSize,
          );
        }),
      );

      const verification = TrainerVerification.create(
        crypto.randomUUID(),
        input.actor.userId,
        input.specialtyKeys,
        input.yearsOfExperience,
        input.shortBio,
        input.idDocumentNumber,
        idDocuments,
        certificates,
      );

      const saved = await this.verificationRepository.save(verification);

      this.eventEmitter.emit(
        'trainer-verification.submitted',
        new TrainerVerificationSubmittedEvent(input.actor.email),
      );

      return {
        verificationId: saved.id,
        status: 'pending',
      };
    } catch (error) {
      await Promise.allSettled(
        uploaded.map((file) =>
          this.storageService.delete(file.containerName, file.blobPath),
        ),
      );
      throw error;
    }
  }

  private async assertSpecialtiesExist(specialtyKeys: string[]): Promise<void> {
    const uniqueKeys = [...new Set(specialtyKeys)];
    const specialties =
      await this.specialtyCatalogRepository.findByKeys(uniqueKeys);
    if (specialties.length !== uniqueKeys.length) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_SPECIALTY_KEY,
        'One or more specialty keys do not exist',
      );
    }
  }

  private async uploadFile(
    userId: string,
    section: string,
    file: Express.Multer.File,
  ): Promise<UploadFileOutput> {
    try {
      return await this.storageService.uploadFile(userId, section, file);
    } catch {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.FILE_UPLOAD_FAILED,
        'Verification file upload failed',
      );
    }
  }
}

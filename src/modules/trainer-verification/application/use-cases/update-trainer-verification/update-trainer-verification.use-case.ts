import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import { UploadFileOutput } from '../../../../../shared/storage/domain/ports/file-storage.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { TrainerCertificate } from '../../../domain/entities/trainer-certificate.entity';
import { TrainerIdDocument } from '../../../domain/entities/trainer-id-document.entity';
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
import { assertTrainer } from '../trainer-verification-use-case.helpers';
import { TrainerVerificationSubmittedEvent } from '../../../../shared/email/domain/events/trainer-verification-submitted.event';

export interface UpdateTrainerCertificateInput {
  name: string;
  issuingOrganization: string;
  documentFile: Express.Multer.File;
}

export interface UpdateTrainerVerificationInput {
  actor: CurrentActor;
  specialtyKeys?: string[];
  yearsOfExperience?: number;
  shortBio?: string;
  idDocumentNumber?: string;
  newIdDocumentFiles?: {
    documentType: string;
    file: Express.Multer.File;
  }[];
  newCertificates?: UpdateTrainerCertificateInput[];
}

export interface UpdateTrainerVerificationOutput {
  verificationId: string;
  status: 'pending';
}

@Injectable()
export class UpdateTrainerVerificationUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    @Inject(SPECIALTY_CATALOG_REPOSITORY_PORT)
    private readonly specialtyCatalogRepository: SpecialtyCatalogRepository,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: UpdateTrainerVerificationInput,
  ): Promise<UpdateTrainerVerificationOutput> {
    assertTrainer(input.actor);

    const verification = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );
    if (!verification) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'Trainer verification was not found',
      );
    }

    if (input.specialtyKeys) {
      await this.assertSpecialtiesExist(input.specialtyKeys);
    }

    const oldFiles = [
      ...(input.newIdDocumentFiles
        ? verification.idDocuments.map((document) => ({
            containerName: document.containerName,
            blobPath: document.fileUrl,
          }))
        : []),
      ...(input.newCertificates
        ? verification.certificates.map((certificate) => ({
            containerName: certificate.containerName,
            blobPath: certificate.documentUrl,
          }))
        : []),
    ];
    const uploaded: UploadFileOutput[] = [];

    try {
      const idDocuments = input.newIdDocumentFiles
        ? await Promise.all(
            input.newIdDocumentFiles.map(async ({ documentType, file }) => {
              const output = await this.uploadFile(
                input.actor.userId,
                'id',
                file,
              );
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
          )
        : undefined;

      const certificates = input.newCertificates
        ? await Promise.all(
            input.newCertificates.map(async (certificate) => {
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
          )
        : undefined;

      verification.resubmit({
        specialtyKeys: input.specialtyKeys,
        yearsOfExperience: input.yearsOfExperience,
        shortBio: input.shortBio,
        idDocumentNumber: input.idDocumentNumber,
        idDocuments,
        certificates,
      });

      const saved = await this.verificationRepository.save(verification);

      this.eventEmitter.emit(
        'trainer-verification.submitted',
        new TrainerVerificationSubmittedEvent(input.actor.email),
      );

      await Promise.allSettled(
        oldFiles.map((file) =>
          this.storageService.delete(file.containerName, file.blobPath),
        ),
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

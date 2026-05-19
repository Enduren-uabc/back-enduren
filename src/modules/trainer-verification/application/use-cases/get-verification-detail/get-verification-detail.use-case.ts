import { Inject, Injectable } from '@nestjs/common';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import {
  TrainerVerificationDetail,
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';
import {
  TRAINER_FLOW_CONFIG_PORT,
  TrainerFlowConfigPort,
} from '../../ports/trainer-flow-config.port';
import { assertAdmin } from '../trainer-verification-use-case.helpers';

export interface GetVerificationDetailInput {
  actor: CurrentActor;
  verificationId: string;
}

export interface GetVerificationDetailOutput extends Omit<
  TrainerVerificationDetail,
  'idDocuments' | 'certificates'
> {
  idDocuments: {
    id: string;
    documentType: string;
    fileName: string;
    fileSize: number;
    signedUrl?: string;
  }[];
  certificates: {
    id: string;
    name: string;
    issuingOrganization: string;
    fileName: string;
    fileSize: number;
    signedUrl: string;
  }[];
}

@Injectable()
export class GetVerificationDetailUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
    private readonly storageService: StorageService,
    @Inject(TRAINER_FLOW_CONFIG_PORT)
    private readonly flowConfig: TrainerFlowConfigPort,
  ) {}

  async execute(
    input: GetVerificationDetailInput,
  ): Promise<GetVerificationDetailOutput> {
    assertAdmin(input.actor);

    const detail = await this.verificationRepository.findDetailById(
      input.verificationId,
    );
    if (!detail) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_FOUND,
        'Trainer verification was not found',
      );
    }

    const isPowerspike = this.flowConfig.isPowerspikeEnabled();

    const idDocuments = await Promise.all(
      detail.idDocuments.map(async (document) => {
        const base = {
          id: document.id,
          documentType: document.documentType,
          fileName: document.fileName,
          fileSize: document.fileSize,
        };

        if (isPowerspike) {
          return base;
        }

        return {
          ...base,
          signedUrl: await this.storageService.getSignedUrl(
            document.containerName,
            document.fileUrl,
          ),
        };
      }),
    );

    const certificates = await Promise.all(
      detail.certificates.map(async (certificate) => ({
        id: certificate.id,
        name: certificate.name,
        issuingOrganization: certificate.issuingOrganization,
        fileName: certificate.fileName,
        fileSize: certificate.fileSize,
        signedUrl: await this.storageService.getSignedUrl(
          certificate.containerName,
          certificate.documentUrl,
        ),
      })),
    );

    const baseResult: GetVerificationDetailOutput = {
      ...detail,
      idDocuments,
      certificates,
    };

    if (!isPowerspike) {
      return baseResult;
    }

    return {
      ...baseResult,
      assignedReviewerId: detail.assignedReviewerId,
      advancedStatus: detail.advancedStatus,
      extractedCertificateData: detail.extractedCertificateData,
      extractedIdData: detail.extractedIdData,
      scoringResult: detail.scoringResult,
      statusHistory: detail.statusHistory,
      auditEvents: detail.auditEvents,
    };
  }
}

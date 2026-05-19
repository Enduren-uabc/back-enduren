import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';
import { assertTrainer } from '../trainer-verification-use-case.helpers';

export interface GetMyVerificationStatusInput {
  actor: CurrentActor;
}

export interface GetMyVerificationStatusOutput {
  verificationId: string | null;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  shortBio?: string;
  advancedStatus?: string;
  certificateExtractionStatus?: 'pending' | 'extracted' | 'failed' | null;
  idExtractionStatus?: 'pending' | 'extracted' | 'failed' | null;
  extractedCertificateInfo?: {
    name: string;
    institution: string;
    ocrConfidence: number;
  };
  extractedIdInfo?: {
    fullName: string;
    documentType: string;
    ocrConfidence: number;
  };
}

@Injectable()
export class GetMyVerificationStatusUseCase {
  constructor(
    @Inject(TRAINER_VERIFICATION_REPOSITORY_PORT)
    private readonly verificationRepository: TrainerVerificationRepository,
  ) {}

  async execute(
    input: GetMyVerificationStatusInput,
  ): Promise<GetMyVerificationStatusOutput> {
    assertTrainer(input.actor);

    const verification = await this.verificationRepository.findByUserId(
      input.actor.userId,
    );
    if (!verification) {
      return {
        verificationId: null,
        status: 'none',
      };
    }

    const result: GetMyVerificationStatusOutput = {
      verificationId: verification.id,
      status: verification.verificationStatus,
      rejectionReason: verification.rejectionReason ?? undefined,
      specialties: verification.specialtyKeys,
      yearsOfExperience: verification.yearsOfExperience,
      shortBio: verification.shortBio,
      advancedStatus: verification.advancedStatus,
    };

    const advStatus = verification.advancedStatus;
    if (advStatus) {
      if (
        advStatus === 'certificate_extraction_pending' ||
        advStatus === 'certificate_extracted' ||
        advStatus === 'certificate_extraction_failed'
      ) {
        if (advStatus === 'certificate_extraction_pending') {
          result.certificateExtractionStatus = 'pending';
        } else if (advStatus === 'certificate_extracted') {
          result.certificateExtractionStatus = 'extracted';
        } else {
          result.certificateExtractionStatus = 'failed';
        }
      }

      if (
        advStatus === 'id_extraction_pending' ||
        advStatus === 'id_extracted' ||
        advStatus === 'id_extraction_failed'
      ) {
        if (advStatus === 'id_extraction_pending') {
          result.idExtractionStatus = 'pending';
        } else if (advStatus === 'id_extracted') {
          result.idExtractionStatus = 'extracted';
        } else {
          result.idExtractionStatus = 'failed';
        }
      }
    }

    if (verification.extractedCertificateData) {
      result.extractedCertificateInfo = {
        name: verification.extractedCertificateData.certificateName,
        institution: verification.extractedCertificateData.issuingOrganization,
        ocrConfidence: verification.extractedCertificateData.ocrConfidence,
      };
    }

    if (verification.extractedIdData) {
      result.extractedIdInfo = {
        fullName: verification.extractedIdData.fullName,
        documentType: verification.extractedIdData.documentType,
        ocrConfidence: verification.extractedIdData.ocrConfidence,
      };
    }

    return result;
  }
}

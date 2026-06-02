import { Inject, Injectable } from '@nestjs/common';
import { CurrentActor } from '../../ports/current-actor.port';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
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
    fullName: string;
    name: string;
    institution: string;
    certifyingInstitution?: string;
    issueDate?: string;
    expirationDate?: string;
    folioNumber?: string;
    qrUrl?: string;
    ocrConfidence: number;
    curp?: string;
    competencyStandardCode?: string;
    competencyStandardName?: string;
  };
  extractedIdInfo?: {
    fullName: string;
    documentType: string;
    issuingCountry?: string;
    birthDate?: string;
    expirationDate?: string;
    documentIdentifier?: string;
    ocrConfidence: number;
    curp?: string;
  };
  riskLevel?: string;
  riskScore?: number;
  riskAlerts?: { code: string; severity: string; message: string }[];
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

    this.applyCertificateExtractionStatus(verification, result);
    this.applyIdExtractionStatus(verification, result);
    this.applyExtractedCertificateInfo(verification, result);
    this.applyExtractedIdInfo(verification, result);
    this.applyScoringInfo(verification, result);

    return result;
  }

  private applyCertificateExtractionStatus(
    verification: TrainerVerification,
    result: GetMyVerificationStatusOutput,
  ): void {
    const advStatus = verification.advancedStatus;
    if (verification.extractedCertificateData) {
      result.certificateExtractionStatus = 'extracted';
    } else if (
      advStatus === 'certificate_extraction_pending' ||
      advStatus === 'certificate_extraction_failed'
    ) {
      result.certificateExtractionStatus =
        advStatus === 'certificate_extraction_pending' ? 'pending' : 'failed';
    } else if (verification.certificates.length > 0) {
      result.certificateExtractionStatus = 'pending';
    }
  }

  private applyIdExtractionStatus(
    verification: TrainerVerification,
    result: GetMyVerificationStatusOutput,
  ): void {
    const advStatus = verification.advancedStatus;
    if (verification.extractedIdData) {
      result.idExtractionStatus = 'extracted';
    } else if (
      advStatus === 'id_extraction_pending' ||
      advStatus === 'id_extraction_failed'
    ) {
      result.idExtractionStatus =
        advStatus === 'id_extraction_pending' ? 'pending' : 'failed';
    } else if (verification.idDocuments.length > 0) {
      result.idExtractionStatus = 'pending';
    }
  }

  private applyExtractedCertificateInfo(
    verification: TrainerVerification,
    result: GetMyVerificationStatusOutput,
  ): void {
    if (!verification.extractedCertificateData) {
      return;
    }
    const cert = verification.extractedCertificateData;
    result.extractedCertificateInfo = {
      fullName: cert.fullName,
      name: cert.certificateName,
      institution: cert.issuingOrganization,
      certifyingInstitution: cert.certifyingInstitution ?? undefined,
      issueDate: cert.issueDate ? cert.issueDate.toISOString() : undefined,
      expirationDate: cert.expirationDate
        ? cert.expirationDate.toISOString()
        : undefined,
      folioNumber: cert.folioNumber ?? undefined,
      qrUrl: cert.qrUrl ?? undefined,
      ocrConfidence: cert.ocrConfidence,
      curp: cert.curp ?? undefined,
      competencyStandardCode: cert.competencyStandardCode ?? undefined,
      competencyStandardName: cert.competencyStandardName ?? undefined,
    };
  }

  private applyExtractedIdInfo(
    verification: TrainerVerification,
    result: GetMyVerificationStatusOutput,
  ): void {
    if (!verification.extractedIdData) {
      return;
    }
    const idData = verification.extractedIdData;
    result.extractedIdInfo = {
      fullName: idData.fullName,
      documentType: idData.documentType,
      issuingCountry: idData.issuingCountry ?? undefined,
      birthDate: idData.birthDate ? idData.birthDate.toISOString() : undefined,
      expirationDate: idData.expirationDate
        ? idData.expirationDate.toISOString()
        : undefined,
      documentIdentifier: idData.documentIdentifier ?? undefined,
      ocrConfidence: idData.ocrConfidence,
      curp: idData.curp ?? undefined,
    };
  }

  private applyScoringInfo(
    verification: TrainerVerification,
    result: GetMyVerificationStatusOutput,
  ): void {
    if (!verification.scoringResult) {
      return;
    }
    result.riskLevel = verification.scoringResult.riskLevel;
    result.riskScore = verification.scoringResult.riskScore;
    result.riskAlerts = verification.scoringResult.alerts.map((a) => ({
      code: a.code,
      severity: a.severity,
      message: a.message,
    }));
  }
}

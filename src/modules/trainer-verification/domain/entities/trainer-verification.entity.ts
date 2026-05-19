import { TrainerCertificate } from './trainer-certificate.entity';
import { TrainerIdDocument } from './trainer-id-document.entity';
import { TrainerVerificationStatusChange } from './trainer-verification-status-change.entity';
import { AdvancedVerificationStatus } from '../value-objects/advanced-verification-status.vo';
import { advancedToLegacy } from '../value-objects/advanced-to-legacy-mapper';
import { VerificationStatus } from '../value-objects/verification-status.vo';
import { ExtractedCertificateData } from '../value-objects/extracted-certificate-data.vo';
import { ExtractedIdData } from '../value-objects/extracted-id-data.vo';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../errors/trainer-verification.domain-error';

export interface TrainerVerificationProps {
  id: string;
  userId: string;
  verificationStatus: VerificationStatus;
  specialtyKeys: string[];
  yearsOfExperience: number;
  shortBio: string;
  idDocumentNumber: string;
  idDocuments: TrainerIdDocument[];
  certificates: TrainerCertificate[];
  rejectionReason: string | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  advancedStatus?: AdvancedVerificationStatus;
  statusHistory?: TrainerVerificationStatusChange[];
  extractedCertificateData?: ExtractedCertificateData | null;
  extractedIdData?: ExtractedIdData | null;
}

export class TrainerVerification {
  public readonly id: string;
  public readonly userId: string;
  public verificationStatus: VerificationStatus;
  public specialtyKeys: string[];
  public yearsOfExperience: number;
  public shortBio: string;
  public idDocumentNumber: string;
  public idDocuments: TrainerIdDocument[];
  public certificates: TrainerCertificate[];
  public rejectionReason: string | null;
  public verifiedBy: string | null;
  public verifiedAt: Date | null;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public advancedStatus: AdvancedVerificationStatus | undefined;
  public statusHistory: TrainerVerificationStatusChange[];
  public extractedCertificateData: ExtractedCertificateData | null;
  public extractedIdData: ExtractedIdData | null;

  private constructor(props: TrainerVerificationProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.verificationStatus = props.verificationStatus;
    this.specialtyKeys = [...new Set(props.specialtyKeys)];
    this.yearsOfExperience = props.yearsOfExperience;
    this.shortBio = props.shortBio.trim();
    this.idDocumentNumber = props.idDocumentNumber.trim();
    this.idDocuments = props.idDocuments;
    this.certificates = props.certificates;
    this.rejectionReason = props.rejectionReason;
    this.verifiedBy = props.verifiedBy;
    this.verifiedAt = props.verifiedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.advancedStatus = props.advancedStatus;
    this.statusHistory = props.statusHistory ?? [];
    this.extractedCertificateData = props.extractedCertificateData ?? null;
    this.extractedIdData = props.extractedIdData ?? null;
    this.validate();
  }

  static create(
    id: string,
    userId: string,
    specialtyKeys: string[],
    yearsOfExperience: number,
    shortBio: string,
    idDocumentNumber: string,
    idDocuments: TrainerIdDocument[],
    certificates: TrainerCertificate[],
  ): TrainerVerification {
    const now = new Date();
    return new TrainerVerification({
      id,
      userId,
      verificationStatus: 'pending',
      specialtyKeys,
      yearsOfExperience,
      shortBio,
      idDocumentNumber,
      idDocuments,
      certificates,
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createDraft(
    id: string,
    userId: string,
    props?: {
      specialtyKeys?: string[];
      yearsOfExperience?: number;
      shortBio?: string;
    },
  ): TrainerVerification {
    const now = new Date();
    return new TrainerVerification({
      id,
      userId,
      verificationStatus: 'pending',
      specialtyKeys: props?.specialtyKeys ?? [],
      yearsOfExperience: props?.yearsOfExperience ?? 0,
      shortBio: props?.shortBio ?? '',
      idDocumentNumber: '',
      idDocuments: [],
      certificates: [],
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
      advancedStatus: 'draft',
    });
  }

  static reconstitute(props: TrainerVerificationProps): TrainerVerification {
    return new TrainerVerification(props);
  }

  approve(adminUserId: string): void {
    if (this.verificationStatus === 'approved') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_ALREADY_APPROVED,
        'Trainer verification is already approved',
      );
    }
    if (this.verificationStatus !== 'pending') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_REJECTED,
        'Only pending trainer verifications can be reviewed',
      );
    }
    this.verificationStatus = 'approved';
    this.rejectionReason = null;
    this.verifiedBy = adminUserId;
    this.verifiedAt = new Date();
    this.updatedAt = new Date();
  }

  reject(adminUserId: string, rejectionReason: string): void {
    if (this.verificationStatus === 'approved') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_ALREADY_APPROVED,
        'Approved trainer verifications cannot be changed',
      );
    }
    if (this.verificationStatus !== 'pending') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_REJECTED,
        'Only pending trainer verifications can be reviewed',
      );
    }
    if (!rejectionReason.trim()) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.REJECTION_REASON_REQUIRED,
        'Rejection reason is required',
      );
    }
    this.verificationStatus = 'rejected';
    this.rejectionReason = rejectionReason.trim();
    this.verifiedBy = adminUserId;
    this.verifiedAt = new Date();
    this.updatedAt = new Date();
  }

  resubmit(input: {
    specialtyKeys?: string[];
    yearsOfExperience?: number;
    shortBio?: string;
    idDocumentNumber?: string;
    idDocuments?: TrainerIdDocument[];
    certificates?: TrainerCertificate[];
  }): void {
    if (this.verificationStatus !== 'rejected') {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.VERIFICATION_NOT_REJECTED,
        'Only rejected trainer verifications can be updated',
      );
    }

    this.specialtyKeys = input.specialtyKeys
      ? [...new Set(input.specialtyKeys)]
      : this.specialtyKeys;
    this.yearsOfExperience = input.yearsOfExperience ?? this.yearsOfExperience;
    this.shortBio = input.shortBio?.trim() ?? this.shortBio;
    this.idDocumentNumber =
      input.idDocumentNumber?.trim() ?? this.idDocumentNumber;
    this.idDocuments = input.idDocuments ?? this.idDocuments;
    this.certificates = input.certificates ?? this.certificates;
    this.verificationStatus = 'pending';
    this.rejectionReason = null;
    this.verifiedBy = null;
    this.verifiedAt = null;
    this.updatedAt = new Date();
    this.validate();
  }

  assignExtractedCertificateData(data: ExtractedCertificateData): void {
    this.extractedCertificateData = data;
  }

  assignExtractedIdData(data: ExtractedIdData): void {
    this.extractedIdData = data;
  }

  applyAdvancedStatusTransition(
    newAdvancedStatus: AdvancedVerificationStatus,
    change: TrainerVerificationStatusChange,
  ): void {
    this.advancedStatus = newAdvancedStatus;
    this.verificationStatus = advancedToLegacy(newAdvancedStatus);
    this.statusHistory.push(change);
    this.updatedAt = new Date();
  }

  private validate(): void {
    if (this.advancedStatus === 'draft') {
      return;
    }
    if (this.specialtyKeys.length < 1) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.TOO_FEW_SPECIALTIES,
        'At least one specialty is required',
      );
    }
    if (this.specialtyKeys.length > 5) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.TOO_MANY_SPECIALTIES,
        'No more than five specialties are allowed',
      );
    }
    if (
      !Number.isInteger(this.yearsOfExperience) ||
      this.yearsOfExperience < 0 ||
      this.yearsOfExperience > 50
    ) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_YEARS_OF_EXPERIENCE,
        'Years of experience must be an integer between 0 and 50',
      );
    }
    if (!this.shortBio || this.shortBio.length > 500) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.BIO_TOO_LONG,
        'Professional bio is required and must be 500 characters or fewer',
      );
    }
    if (!this.idDocumentNumber || this.idDocumentNumber.trim().length > 100) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.ID_DOCUMENT_NUMBER_REQUIRED,
        'ID document number is required and must be 100 characters or fewer',
      );
    }
    if (this.idDocuments.length < 1) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.TOO_FEW_ID_DOCUMENTS,
        'At least one ID document is required',
      );
    }
    if (this.idDocuments.length > 3) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.TOO_MANY_ID_DOCUMENTS,
        'No more than three ID documents are allowed',
      );
    }
    if (this.certificates.length < 1) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.TOO_FEW_CERTIFICATES,
        'At least one certificate is required',
      );
    }
    if (this.certificates.length > 5) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.TOO_MANY_CERTIFICATES,
        'No more than five certificates are allowed',
      );
    }
  }
}

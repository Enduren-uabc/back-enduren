import { TrainerVerification } from '../entities/trainer-verification.entity';
import { SpecialtyCatalogEntry } from '../entities/specialty-catalog-entry.entity';

export const TRAINER_VERIFICATION_REPOSITORY_PORT = Symbol(
  'TRAINER_VERIFICATION_REPOSITORY_PORT',
);

export interface TrainerVerificationListItem {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  submittedAt: Date;
  specialties: string[];
  advancedStatus?: string;
  riskLevel?: string;
  riskScore?: number;
}

export interface TrainerVerificationDetail {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  status: 'pending' | 'approved' | 'rejected';
  specialties: SpecialtyCatalogEntry[];
  yearsOfExperience: number;
  shortBio: string;
  idDocumentNumber: string;
  idDocuments: {
    id: string;
    documentType: string;
    containerName: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }[];
  certificates: {
    id: string;
    name: string;
    issuingOrganization: string;
    containerName: string;
    documentUrl: string;
    fileName: string;
    fileSize: number;
  }[];
  rejectionReason: string | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedReviewerId?: string | null;
  advancedStatus?: string;
  extractedCertificateData?: {
    fullName: string;
    certificateName: string;
    issuingOrganization: string;
    issueDate?: string;
    expirationDate?: string;
    folioNumber?: string;
    qrUrl?: string;
    ocrConfidence: number;
  } | null;
  extractedIdData?: {
    fullName: string;
    documentType: string;
    issuingCountry?: string;
    birthDate?: string;
    expirationDate?: string;
    documentIdentifier?: string;
    ocrConfidence: number;
  } | null;
  scoringResult?: {
    riskScore: number;
    riskLevel: string;
    recommendedAction: string;
    summary: string;
    positiveSignals: string[];
    alerts: { code: string; severity: string; message: string }[];
    overrides: string[];
  } | null;
  statusHistory?: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    actorId: string;
    actorType: string;
    reason?: string;
    createdAt: string;
  }[];
  auditEvents?: {
    id: string;
    eventType: string;
    actorId: string;
    actorType: string;
    description: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }[];
}

export interface TrainerVerificationRepository {
  save(verification: TrainerVerification): Promise<TrainerVerification>;
  findById(id: string): Promise<TrainerVerification | null>;
  findByUserId(userId: string): Promise<TrainerVerification | null>;
  listPending(
    page: number,
    limit: number,
  ): Promise<{ verifications: TrainerVerificationListItem[]; total: number }>;
  findDetailById(id: string): Promise<TrainerVerificationDetail | null>;
  listPendingAdvanced(
    page: number,
    limit: number,
  ): Promise<{ verifications: TrainerVerificationListItem[]; total: number }>;
}

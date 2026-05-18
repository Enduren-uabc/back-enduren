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
}

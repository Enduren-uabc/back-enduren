export interface VerificationStatusResponseDto {
  verificationId: string | null;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  shortBio?: string;
}

export interface TrainerVerificationFiles {
  idDocuments?: Express.Multer.File[];
  certificateDocuments?: Express.Multer.File[];
}

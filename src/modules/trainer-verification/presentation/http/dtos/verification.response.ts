export interface VerificationStatusResponseDto {
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

export interface TrainerVerificationFiles {
  idDocuments?: Express.Multer.File[];
  certificateDocuments?: Express.Multer.File[];
}

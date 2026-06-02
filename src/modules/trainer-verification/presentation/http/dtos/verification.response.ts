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
    hasVeracityCode?: boolean;
    veracityCode?: string;
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

export interface TrainerVerificationFiles {
  idDocuments?: Express.Multer.File[];
  certificateDocuments?: Express.Multer.File[];
}

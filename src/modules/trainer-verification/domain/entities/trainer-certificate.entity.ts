import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../errors/trainer-verification.domain-error';

export interface TrainerCertificateProps {
  id: string;
  name: string;
  issuingOrganization: string;
  containerName: string;
  documentUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

export class TrainerCertificate {
  public readonly id: string;
  public readonly name: string;
  public readonly issuingOrganization: string;
  public readonly containerName: string;
  public readonly documentUrl: string;
  public readonly fileName: string;
  public readonly fileSize: number;
  public readonly uploadedAt: Date;

  private constructor(props: TrainerCertificateProps) {
    if (
      !props.name.trim() ||
      props.name.trim().length > 255 ||
      !props.issuingOrganization.trim() ||
      props.issuingOrganization.trim().length > 255
    ) {
      throw new TrainerVerificationDomainError(
        TrainerVerificationErrorCode.INVALID_CERTIFICATE,
        'Certificate name and issuing organization are required and must be 255 characters or fewer',
      );
    }
    this.id = props.id;
    this.name = props.name.trim();
    this.issuingOrganization = props.issuingOrganization.trim();
    this.containerName = props.containerName;
    this.documentUrl = props.documentUrl;
    this.fileName = props.fileName;
    this.fileSize = props.fileSize;
    this.uploadedAt = props.uploadedAt;
  }

  static create(
    id: string,
    name: string,
    issuingOrganization: string,
    containerName: string,
    documentUrl: string,
    fileName: string,
    fileSize: number,
  ): TrainerCertificate {
    return new TrainerCertificate({
      id,
      name,
      issuingOrganization,
      containerName,
      documentUrl,
      fileName,
      fileSize,
      uploadedAt: new Date(),
    });
  }

  static reconstitute(props: TrainerCertificateProps): TrainerCertificate {
    return new TrainerCertificate(props);
  }
}

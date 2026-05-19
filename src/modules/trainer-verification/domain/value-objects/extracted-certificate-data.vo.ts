export interface ExtractedCertificateDataProps {
  fullName: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate?: Date;
  expirationDate?: Date;
  folioNumber?: string;
  qrUrl?: string;
  ocrConfidence: number;
}

export class ExtractedCertificateData {
  public readonly fullName: string;
  public readonly certificateName: string;
  public readonly issuingOrganization: string;
  public readonly issueDate?: Date;
  public readonly expirationDate?: Date;
  public readonly folioNumber?: string;
  public readonly qrUrl?: string;
  public readonly ocrConfidence: number;

  private constructor(props: ExtractedCertificateDataProps) {
    this.fullName = props.fullName;
    this.certificateName = props.certificateName;
    this.issuingOrganization = props.issuingOrganization;
    this.issueDate = props.issueDate;
    this.expirationDate = props.expirationDate;
    this.folioNumber = props.folioNumber;
    this.qrUrl = props.qrUrl;
    this.ocrConfidence = props.ocrConfidence;
  }

  static create(
    props: ExtractedCertificateDataProps,
  ): ExtractedCertificateData {
    return new ExtractedCertificateData(props);
  }

  static reconstitute(
    props: ExtractedCertificateDataProps,
  ): ExtractedCertificateData {
    return new ExtractedCertificateData(props);
  }
}

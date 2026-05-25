export interface ExtractedCertificateDataProps {
  fullName: string;
  certificateName: string;
  issuingOrganization: string;
  issueDate?: Date;
  expirationDate?: Date;
  folioNumber?: string;
  qrUrl?: string;
  ocrConfidence: number;
  curp?: string;
  documentType?: string;
  certifyingInstitution?: string;
  competencyStandardCode?: string;
  competencyStandardName?: string;
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
  public readonly curp?: string;
  public readonly documentType?: string;
  public readonly certifyingInstitution?: string;
  public readonly competencyStandardCode?: string;
  public readonly competencyStandardName?: string;

  private constructor(props: ExtractedCertificateDataProps) {
    this.fullName = props.fullName;
    this.certificateName = props.certificateName;
    this.issuingOrganization = props.issuingOrganization;
    this.issueDate = props.issueDate;
    this.expirationDate = props.expirationDate;
    this.folioNumber = props.folioNumber;
    this.qrUrl = props.qrUrl;
    this.ocrConfidence = props.ocrConfidence;
    this.curp = props.curp;
    this.documentType = props.documentType;
    this.certifyingInstitution = props.certifyingInstitution;
    this.competencyStandardCode = props.competencyStandardCode;
    this.competencyStandardName = props.competencyStandardName;
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

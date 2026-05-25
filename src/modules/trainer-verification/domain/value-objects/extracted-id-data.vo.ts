export interface ExtractedIdDataProps {
  fullName: string;
  documentType: string;
  issuingCountry?: string;
  birthDate?: Date;
  expirationDate?: Date;
  documentIdentifier?: string;
  ocrConfidence: number;
  curp?: string;
}

export class ExtractedIdData {
  public readonly fullName: string;
  public readonly documentType: string;
  public readonly issuingCountry?: string;
  public readonly birthDate?: Date;
  public readonly expirationDate?: Date;
  public readonly documentIdentifier?: string;
  public readonly ocrConfidence: number;
  public readonly curp?: string;

  private constructor(props: ExtractedIdDataProps) {
    this.fullName = props.fullName;
    this.documentType = props.documentType;
    this.issuingCountry = props.issuingCountry;
    this.birthDate = props.birthDate;
    this.expirationDate = props.expirationDate;
    this.documentIdentifier = props.documentIdentifier;
    this.ocrConfidence = props.ocrConfidence;
    this.curp = props.curp;
  }

  static create(props: ExtractedIdDataProps): ExtractedIdData {
    return new ExtractedIdData(props);
  }

  static reconstitute(props: ExtractedIdDataProps): ExtractedIdData {
    return new ExtractedIdData(props);
  }
}

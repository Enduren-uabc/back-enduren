import { DocumentType } from '../value-objects/document-type.vo';

export interface TrainerIdDocumentProps {
  id: string;
  documentType: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
}

export class TrainerIdDocument {
  public readonly id: string;
  public readonly documentType: DocumentType;
  public readonly fileUrl: string;
  public readonly fileName: string;
  public readonly fileSize: number;
  public readonly uploadedAt: Date;

  private constructor(props: TrainerIdDocumentProps) {
    this.id = props.id;
    this.documentType = props.documentType;
    this.fileUrl = props.fileUrl;
    this.fileName = props.fileName;
    this.fileSize = props.fileSize;
    this.uploadedAt = props.uploadedAt;
  }

  static create(
    id: string,
    documentType: DocumentType,
    fileUrl: string,
    fileName: string,
    fileSize: number,
  ): TrainerIdDocument {
    return new TrainerIdDocument({
      id,
      documentType,
      fileUrl,
      fileName,
      fileSize,
      uploadedAt: new Date(),
    });
  }

  static reconstitute(props: TrainerIdDocumentProps): TrainerIdDocument {
    return new TrainerIdDocument(props);
  }
}

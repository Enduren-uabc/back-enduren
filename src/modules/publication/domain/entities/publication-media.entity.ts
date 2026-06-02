export interface PublicationMediaProps {
  id: string;
  publicationId: string | null;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sortOrder: number;
  createdAt: Date;
}

export interface CreatePublicationMediaParams {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  sortOrder: number;
}

export class PublicationMedia {
  public readonly id: string;
  public readonly publicationId: string | null;
  public readonly url: string;
  public readonly fileName: string;
  public readonly fileSize: number;
  public readonly mimeType: string;
  public readonly sortOrder: number;
  public readonly createdAt: Date;

  private constructor(props: PublicationMediaProps) {
    this.id = props.id;
    this.publicationId = props.publicationId;
    this.url = props.url;
    this.fileName = props.fileName;
    this.fileSize = props.fileSize;
    this.mimeType = props.mimeType;
    this.sortOrder = props.sortOrder;
    this.createdAt = props.createdAt;
  }

  static create(params: CreatePublicationMediaParams): PublicationMedia {
    return new PublicationMedia({
      id: params.id,
      publicationId: null,
      url: params.url,
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      sortOrder: params.sortOrder,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: PublicationMediaProps): PublicationMedia {
    return new PublicationMedia(props);
  }

  linkToPublication(publicationId: string): PublicationMedia {
    return new PublicationMedia({
      id: this.id,
      publicationId,
      url: this.url,
      fileName: this.fileName,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt,
    });
  }
}

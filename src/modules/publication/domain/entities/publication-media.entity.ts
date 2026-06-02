export class PublicationMedia {
  public readonly id: string;
  public readonly publicationId: string | null;
  public readonly url: string;
  public readonly fileName: string;
  public readonly fileSize: number;
  public readonly mimeType: string;
  public readonly sortOrder: number;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    publicationId: string | null,
    url: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    sortOrder: number,
    createdAt: Date,
  ) {
    this.id = id;
    this.publicationId = publicationId;
    this.url = url;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
    this.sortOrder = sortOrder;
    this.createdAt = createdAt;
  }

  static create(
    id: string,
    url: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    sortOrder: number,
  ): PublicationMedia {
    return new PublicationMedia(
      id,
      null,
      url,
      fileName,
      fileSize,
      mimeType,
      sortOrder,
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    publicationId: string | null,
    url: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    sortOrder: number,
    createdAt: Date,
  ): PublicationMedia {
    return new PublicationMedia(
      id,
      publicationId,
      url,
      fileName,
      fileSize,
      mimeType,
      sortOrder,
      createdAt,
    );
  }

  linkToPublication(publicationId: string): PublicationMedia {
    return new PublicationMedia(
      this.id,
      publicationId,
      this.url,
      this.fileName,
      this.fileSize,
      this.mimeType,
      this.sortOrder,
      this.createdAt,
    );
  }
}

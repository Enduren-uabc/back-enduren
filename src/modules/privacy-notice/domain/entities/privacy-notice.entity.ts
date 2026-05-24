export interface CreatePrivacyNoticeProps {
  version: string;
  content: string;
  updatedAt: Date;
  contentHash?: string;
}

export class PrivacyNotice {
  public readonly id: string;
  public readonly version: string;
  public readonly content: string;
  public readonly updatedAt: Date;
  public readonly isActive: boolean;
  public readonly contentHash: string | null;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    version: string,
    content: string,
    updatedAt: Date,
    isActive: boolean,
    contentHash: string | null,
    createdAt: Date,
  ) {
    this.id = id;
    this.version = version;
    this.content = content;
    this.updatedAt = updatedAt;
    this.isActive = isActive;
    this.contentHash = contentHash;
    this.createdAt = createdAt;
  }

  public static create(props: CreatePrivacyNoticeProps): PrivacyNotice {
    return new PrivacyNotice(
      crypto.randomUUID(),
      props.version,
      props.content,
      props.updatedAt,
      true,
      props.contentHash ?? null,
      new Date(),
    );
  }

  public static reconstitute(props: {
    id: string;
    version: string;
    content: string;
    updatedAt: Date;
    isActive: boolean;
    contentHash: string | null;
    createdAt: Date;
  }): PrivacyNotice {
    return new PrivacyNotice(
      props.id,
      props.version,
      props.content,
      props.updatedAt,
      props.isActive,
      props.contentHash,
      props.createdAt,
    );
  }
}

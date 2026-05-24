export interface SocialAuthCodeProps {
  id: string;
  code: string;
  userId: string;
  provider: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class SocialAuthCode {
  public readonly id: string;
  public readonly code: string;
  public readonly userId: string;
  public readonly provider: string;
  public readonly expiresAt: Date;
  public usedAt: Date | null;
  public readonly createdAt: Date;

  private constructor(props: SocialAuthCodeProps) {
    this.id = props.id;
    this.code = props.code;
    this.userId = props.userId;
    this.provider = props.provider;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt;
    this.createdAt = props.createdAt;
  }

  static create(
    userId: string,
    provider: string,
    code: string,
    expiresAt: Date,
  ): SocialAuthCode {
    return new SocialAuthCode({
      id: crypto.randomUUID(),
      code,
      userId,
      provider,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: SocialAuthCodeProps): SocialAuthCode {
    return new SocialAuthCode(props);
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  markAsUsed(): void {
    this.usedAt = new Date();
  }
}

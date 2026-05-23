export interface EmailVerificationTokenProps {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class EmailVerificationToken {
  public readonly id: string;
  public readonly userId: string;
  public readonly token: string;
  public readonly expiresAt: Date;
  public usedAt: Date | null;
  public readonly createdAt: Date;

  private constructor(props: EmailVerificationTokenProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt;
    this.createdAt = props.createdAt;
  }

  static create(userId: string, token: string, expiresAt: Date): EmailVerificationToken {
    return new EmailVerificationToken({
      id: crypto.randomUUID(),
      userId,
      token,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: EmailVerificationTokenProps): EmailVerificationToken {
    return new EmailVerificationToken(props);
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  markAsUsed(): void {
    this.usedAt = new Date();
  }
}

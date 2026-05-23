export interface PasswordResetTokenProps {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class PasswordResetToken {
  public readonly id: string;
  public readonly userId: string;
  public readonly token: string;
  public readonly expiresAt: Date;
  public usedAt: Date | null;
  public readonly createdAt: Date;

  private constructor(props: PasswordResetTokenProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt;
    this.createdAt = props.createdAt;
  }

  static create(userId: string, token: string, expiresAt: Date): PasswordResetToken {
    return new PasswordResetToken({
      id: crypto.randomUUID(),
      userId,
      token,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: PasswordResetTokenProps): PasswordResetToken {
    return new PasswordResetToken(props);
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  markAsUsed(): void {
    this.usedAt = new Date();
  }
}

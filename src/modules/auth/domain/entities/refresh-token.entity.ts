export interface RefreshTokenProps {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt: Date | null;
}

export class RefreshToken {
  public readonly id: string;
  public readonly token: string;
  public readonly userId: string;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;
  public usedAt: Date | null;

  private constructor(props: RefreshTokenProps) {
    this.id = props.id;
    this.token = props.token;
    this.userId = props.userId;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.usedAt = props.usedAt;
  }

  static create(
    id: string,
    token: string,
    userId: string,
    expiresAt: Date,
  ): RefreshToken {
    return new RefreshToken({
      id,
      token,
      userId,
      expiresAt,
      createdAt: new Date(),
      usedAt: null,
    });
  }

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken(props);
  }

  markAsUsed(): void {
    this.usedAt = new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null;
  }
}

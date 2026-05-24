export type Platform = 'ios' | 'android';

export class PushToken {
  public readonly id: string;
  public readonly userId: string;
  public readonly token: string;
  public readonly platform: Platform;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(
    id: string,
    userId: string,
    token: string,
    platform: Platform,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.platform = platform;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static create(userId: string, token: string, platform: Platform): PushToken {
    return new PushToken(crypto.randomUUID(), userId, token, platform, new Date(), new Date());
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    token: string;
    platform: Platform;
    createdAt: Date;
    updatedAt: Date;
  }): PushToken {
    return new PushToken(props.id, props.userId, props.token, props.platform, props.createdAt, props.updatedAt);
  }
}

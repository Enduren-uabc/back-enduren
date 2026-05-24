export type NotificationType = 'reminder';

export class InAppNotification {
  public readonly id: string;
  public readonly userId: string;
  public readonly title: string;
  public readonly body: string;
  public readonly type: NotificationType;
  public readonly readAt: Date | null;
  public readonly createdAt: Date;

  private constructor(
    id: string,
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    readAt: Date | null,
    createdAt: Date,
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.body = body;
    this.type = type;
    this.readAt = readAt;
    this.createdAt = createdAt;
  }

  public static create(userId: string, title: string, body: string): InAppNotification {
    return new InAppNotification(crypto.randomUUID(), userId, title, body, 'reminder', null, new Date());
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    readAt: Date | null;
    createdAt: Date;
  }): InAppNotification {
    return new InAppNotification(props.id, props.userId, props.title, props.body, props.type, props.readAt, props.createdAt);
  }

  public markAsRead(): InAppNotification {
    return new InAppNotification(this.id, this.userId, this.title, this.body, this.type, new Date(), this.createdAt);
  }

  public get isRead(): boolean {
    return this.readAt !== null;
  }
}

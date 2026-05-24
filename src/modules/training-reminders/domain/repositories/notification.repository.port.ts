import { InAppNotification } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY_PORT = Symbol(
  'NOTIFICATION_REPOSITORY_PORT',
);

export interface NotificationRepository {
  save(notification: InAppNotification): Promise<InAppNotification>;
  findByUserId(userId: string): Promise<InAppNotification[]>;
  markAsRead(id: string): Promise<void>;
  countUnread(userId: string): Promise<number>;
}

import { InAppNotification, type NotificationType } from '../../domain/entities/notification.entity';
import { NotificationTypeormEntity } from '../persistence/typeorm/entities/notification-typeorm.entity';

export class NotificationMapper {
  public static toDomain(orm: NotificationTypeormEntity): InAppNotification {
    return InAppNotification.reconstitute({
      id: orm.id,
      userId: orm.userId,
      title: orm.title,
      body: orm.body,
      type: orm.type as NotificationType,
      readAt: orm.readAt,
      createdAt: orm.createdAt,
    });
  }

  public static toOrm(domain: InAppNotification): NotificationTypeormEntity {
    const orm = new NotificationTypeormEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.title = domain.title;
    orm.body = domain.body;
    orm.type = domain.type;
    orm.readAt = domain.readAt;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}

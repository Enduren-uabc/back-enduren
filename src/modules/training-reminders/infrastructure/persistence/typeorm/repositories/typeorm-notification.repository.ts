import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { InAppNotification } from '../../../../domain/entities/notification.entity';
import { NotificationRepository } from '../../../../domain/repositories/notification.repository.port';
import { NotificationTypeormEntity } from '../entities/notification-typeorm.entity';
import { NotificationMapper } from '../../../mappers/notification.mapper';

@Injectable()
export class TypeormNotificationRepository implements NotificationRepository {
  constructor(
    @InjectRepository(NotificationTypeormEntity)
    private readonly ormRepo: Repository<NotificationTypeormEntity>,
  ) {}

  public async save(
    notification: InAppNotification,
  ): Promise<InAppNotification> {
    const orm = NotificationMapper.toOrm(notification);
    const saved = await this.ormRepo.save(orm);
    return NotificationMapper.toDomain(saved);
  }

  public async findByUserId(userId: string): Promise<InAppNotification[]> {
    const orms = await this.ormRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return orms.map(NotificationMapper.toDomain);
  }

  public async markAsRead(id: string): Promise<void> {
    await this.ormRepo.update(id, { readAt: new Date() });
  }

  public async countUnread(userId: string): Promise<number> {
    return this.ormRepo.count({
      where: { userId, readAt: IsNull() },
    });
  }
}

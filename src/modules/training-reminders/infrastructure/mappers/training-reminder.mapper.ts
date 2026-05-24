import { TrainingReminder, type ReminderStatus } from '../../domain/entities/training-reminder.entity';
import type { DayOfWeek } from '../../domain/value-objects/day-of-week.vo';
import { TrainingReminderTypeormEntity } from '../persistence/typeorm/entities/training-reminder-typeorm.entity';

export class TrainingReminderMapper {
  public static toDomain(orm: TrainingReminderTypeormEntity): TrainingReminder {
    return TrainingReminder.reconstitute({
      id: orm.id,
      userId: orm.userId,
      routineId: orm.routineId,
      routineName: orm.routineName,
      dayOfWeek: orm.dayOfWeek as DayOfWeek,
      time: orm.time,
      timezone: orm.timezone,
      status: orm.status as ReminderStatus,
      nextActivationAt: orm.nextActivationAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt,
    });
  }

  public static toOrm(domain: TrainingReminder): TrainingReminderTypeormEntity {
    const orm = new TrainingReminderTypeormEntity();
    orm.id = domain.id;
    orm.userId = domain.userId;
    orm.routineId = domain.routineId;
    orm.routineName = domain.routineName;
    orm.dayOfWeek = domain.dayOfWeek;
    orm.time = domain.time;
    orm.timezone = domain.timezone;
    orm.status = domain.status;
    orm.nextActivationAt = domain.nextActivationAt;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    orm.deletedAt = domain.deletedAt;
    return orm;
  }
}

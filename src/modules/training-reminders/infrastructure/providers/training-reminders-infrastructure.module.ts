import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingReminderTypeormEntity } from '../persistence/typeorm/entities/training-reminder-typeorm.entity';
import { PushTokenTypeormEntity } from '../persistence/typeorm/entities/push-token-typeorm.entity';
import { NotificationTypeormEntity } from '../persistence/typeorm/entities/notification-typeorm.entity';
import { TypeormTrainingReminderRepository } from '../persistence/typeorm/repositories/typeorm-training-reminder.repository';
import { TypeormPushTokenRepository } from '../persistence/typeorm/repositories/typeorm-push-token.repository';
import { TypeormNotificationRepository } from '../persistence/typeorm/repositories/typeorm-notification.repository';
import { TRAINING_REMINDER_REPOSITORY_PORT } from '../../domain/repositories/training-reminder.repository.port';
import { PUSH_TOKEN_REPOSITORY_PORT } from '../../domain/repositories/push-token.repository.port';
import { NOTIFICATION_REPOSITORY_PORT } from '../../domain/repositories/notification.repository.port';
import { ROUTINE_REPOSITORY_PORT } from '../../application/use-cases/create-reminder/create-reminder.use-case';
import { PUSH_NOTIFICATION_PORT } from '../../application/ports/push-notification.port';
import { ExpoPushService } from '../push/expo-push.service';
import { ReminderSchedulerService } from '../scheduling/reminder-scheduler.service';
import { ReminderDueListener } from '../listeners/reminder-due.listener';
import { ReminderCreatedListener } from '../listeners/reminder-created.listener';
import { ReminderDeletedListener } from '../listeners/reminder-deleted.listener';
import { TypeormRoutineRepository } from '../../../../modules/training/infrastructure/persistence/typeorm/repositories/typeorm-routine.repository';
import { RoutineTypeormEntity } from '../../../../modules/training/infrastructure/persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../../../../modules/training/infrastructure/persistence/typeorm/entities/routine-day-typeorm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingReminderTypeormEntity,
      PushTokenTypeormEntity,
      NotificationTypeormEntity,
      RoutineTypeormEntity,
      RoutineDayTypeormEntity,
    ]),
  ],
  providers: [
    {
      provide: TRAINING_REMINDER_REPOSITORY_PORT,
      useClass: TypeormTrainingReminderRepository,
    },
    {
      provide: ROUTINE_REPOSITORY_PORT,
      useClass: TypeormRoutineRepository,
    },
    {
      provide: PUSH_TOKEN_REPOSITORY_PORT,
      useClass: TypeormPushTokenRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY_PORT,
      useClass: TypeormNotificationRepository,
    },
    {
      provide: PUSH_NOTIFICATION_PORT,
      useClass: ExpoPushService,
    },
    ReminderSchedulerService,
    ReminderDueListener,
    ReminderCreatedListener,
    ReminderDeletedListener,
  ],
  exports: [
    TRAINING_REMINDER_REPOSITORY_PORT,
    ROUTINE_REPOSITORY_PORT,
    PUSH_TOKEN_REPOSITORY_PORT,
    NOTIFICATION_REPOSITORY_PORT,
    PUSH_NOTIFICATION_PORT,
  ],
})
export class TrainingRemindersInfrastructureModule {}

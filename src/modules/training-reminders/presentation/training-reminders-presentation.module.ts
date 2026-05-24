import { Module } from '@nestjs/common';
import { RemindersController } from './http/controllers/reminders.controller';
import { PushTokenController } from './http/controllers/push-token.controller';
import { NotificationsController } from './http/controllers/notifications.controller';
import { TrainingRemindersApplicationModule } from '../application/training-reminders-application.module';
import { TRAINING_REMINDER_REPOSITORY_PORT } from '../domain/repositories/training-reminder.repository.port';
import { PUSH_TOKEN_REPOSITORY_PORT } from '../domain/repositories/push-token.repository.port';
import { NOTIFICATION_REPOSITORY_PORT } from '../domain/repositories/notification.repository.port';
import { TrainingRemindersInfrastructureModule } from '../infrastructure/providers/training-reminders-infrastructure.module';

@Module({
  imports: [TrainingRemindersApplicationModule, TrainingRemindersInfrastructureModule],
  controllers: [RemindersController, PushTokenController, NotificationsController],
})
export class TrainingRemindersPresentationModule {}

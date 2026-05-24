import { Module } from '@nestjs/common';
import { RemindersController } from './http/controllers/reminders.controller';
import { TrainingRemindersApplicationModule } from '../application/training-reminders-application.module';

@Module({
  imports: [TrainingRemindersApplicationModule],
  controllers: [RemindersController],
})
export class TrainingRemindersPresentationModule {}

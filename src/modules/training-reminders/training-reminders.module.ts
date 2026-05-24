import { Module } from '@nestjs/common';
import { TrainingRemindersInfrastructureModule } from './infrastructure/providers/training-reminders-infrastructure.module';
import { TrainingRemindersPresentationModule } from './presentation/training-reminders-presentation.module';

@Module({
  imports: [
    TrainingRemindersInfrastructureModule,
    TrainingRemindersPresentationModule,
  ],
})
export class TrainingRemindersModule {}

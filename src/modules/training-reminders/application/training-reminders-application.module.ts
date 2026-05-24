import { Module } from '@nestjs/common';
import { TrainingRemindersInfrastructureModule } from '../infrastructure/providers/training-reminders-infrastructure.module';
import { TRAINING_REMINDER_REPOSITORY_PORT } from '../domain/repositories/training-reminder.repository.port';
import { CreateReminderUseCase, ROUTINE_REPOSITORY_PORT } from './use-cases/create-reminder/create-reminder.use-case';
import { ListRemindersUseCase } from './use-cases/list-reminders/list-reminders.use-case';
import { EditReminderUseCase } from './use-cases/edit-reminder/edit-reminder.use-case';
import { DeleteReminderUseCase } from './use-cases/delete-reminder/delete-reminder.use-case';
import type { TrainingReminderRepository } from '../domain/repositories/training-reminder.repository.port';
import type { RoutineRepository } from './use-cases/create-reminder/create-reminder.use-case';
import type { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  imports: [TrainingRemindersInfrastructureModule],
  providers: [
    {
      provide: CreateReminderUseCase,
      inject: [TRAINING_REMINDER_REPOSITORY_PORT, ROUTINE_REPOSITORY_PORT, 'EventEmitter2'],
      useFactory: (
        reminderRepo: TrainingReminderRepository,
        routineRepo: RoutineRepository,
        eventEmitter: EventEmitter2,
      ) => new CreateReminderUseCase(reminderRepo, routineRepo, eventEmitter),
    },
    {
      provide: ListRemindersUseCase,
      inject: [TRAINING_REMINDER_REPOSITORY_PORT],
      useFactory: (reminderRepo: TrainingReminderRepository) =>
        new ListRemindersUseCase(reminderRepo),
    },
    {
      provide: EditReminderUseCase,
      inject: [TRAINING_REMINDER_REPOSITORY_PORT],
      useFactory: (reminderRepo: TrainingReminderRepository) =>
        new EditReminderUseCase(reminderRepo),
    },
    {
      provide: DeleteReminderUseCase,
      inject: [TRAINING_REMINDER_REPOSITORY_PORT, 'EventEmitter2'],
      useFactory: (
        reminderRepo: TrainingReminderRepository,
        eventEmitter: EventEmitter2,
      ) => new DeleteReminderUseCase(reminderRepo, eventEmitter),
    },
  ],
  exports: [
    CreateReminderUseCase,
    ListRemindersUseCase,
    EditReminderUseCase,
    DeleteReminderUseCase,
  ],
})
export class TrainingRemindersApplicationModule {}

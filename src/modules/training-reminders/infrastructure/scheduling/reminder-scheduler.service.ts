import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TrainingReminderRepository, TRAINING_REMINDER_REPOSITORY_PORT } from '../../domain/repositories/training-reminder.repository.port';
import { ReminderDueEvent } from '../../domain/events/reminder-due.event';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger(ReminderSchedulerService.name);

  constructor(
    @Inject(TRAINING_REMINDER_REPOSITORY_PORT)
    private readonly reminderRepository: TrainingReminderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  public async checkDueReminders(): Promise<void> {
    const now = new Date();
    this.logger.debug(`Checking due reminders at ${now.toISOString()}`);

    const dueReminders = await this.reminderRepository.findDue(now);

    if (dueReminders.length === 0) {
      return;
    }

    this.logger.log(`Found ${dueReminders.length} due reminder(s)`);

    for (const reminder of dueReminders) {
      const updated = reminder.recalculateNextActivation();

      await this.reminderRepository.save(reminder.withNextActivation(updated));

      this.eventEmitter.emit(
        'reminder.due',
        new ReminderDueEvent(
          reminder.id,
          reminder.userId,
          reminder.routineName,
          reminder.dayOfWeek,
        ),
      );
    }
  }
}

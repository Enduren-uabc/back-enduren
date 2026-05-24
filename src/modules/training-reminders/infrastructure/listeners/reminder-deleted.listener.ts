import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReminderDeletedEvent } from '../../domain/events/reminder-deleted.event';

@Injectable()
export class ReminderDeletedListener {
  private readonly logger = new Logger(ReminderDeletedListener.name);

  @OnEvent('reminder.deleted', { async: true })
  public async handle(event: ReminderDeletedEvent): Promise<void> {
    this.logger.log(`Reminder deleted: ${event.reminderId} for user ${event.userId}. Future activations cancelled.`);
  }
}

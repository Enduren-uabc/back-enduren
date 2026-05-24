import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReminderCreatedEvent } from '../../domain/events/reminder-created.event';

@Injectable()
export class ReminderCreatedListener {
  private readonly logger = new Logger(ReminderCreatedListener.name);

  @OnEvent('reminder.created', { async: true })
  public async handle(event: ReminderCreatedEvent): Promise<void> {
    this.logger.log(
      `Reminder created: ${event.reminderId} for user ${event.userId}. ` +
        `Next activation: ${event.nextActivationAt.toISOString()}`,
    );
  }
}

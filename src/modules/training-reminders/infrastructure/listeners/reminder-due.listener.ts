import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReminderDueEvent } from '../../domain/events/reminder-due.event';
import { PushTokenRepository } from '../../domain/repositories/push-token.repository.port';
import { NotificationRepository } from '../../domain/repositories/notification.repository.port';
import { PushNotificationPort } from '../../application/ports/push-notification.port';
import { InAppNotification } from '../../domain/entities/notification.entity';

@Injectable()
export class ReminderDueListener {
  private readonly logger = new Logger(ReminderDueListener.name);

  constructor(
    private readonly pushTokenRepository: PushTokenRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly pushNotificationService: PushNotificationPort,
  ) {}

  @OnEvent('reminder.due', { async: true })
  public async handle(event: ReminderDueEvent): Promise<void> {
    this.logger.log(`Processing due reminder ${event.reminderId} for user ${event.userId}`);

    const title = '¡Hora de entrenar!';
    const body = `Es momento de tu rutina "${event.routineName}" (${event.dayOfWeek}).`;

    try {
      const tokens = await this.pushTokenRepository.findByUserId(event.userId);
      const pushTokenValues = tokens.map((t) => t.token);

      if (pushTokenValues.length > 0) {
        await this.pushNotificationService.send(event.userId, title, body, pushTokenValues);
      }

      const notification = InAppNotification.create(event.userId, title, body);
      await this.notificationRepository.save(notification);

      this.logger.log(`Reminder ${event.reminderId} processed successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to process reminder ${event.reminderId} for user ${event.userId}`,
        error,
      );
    }
  }
}

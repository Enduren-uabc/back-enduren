import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushNotificationPort } from '../../application/ports/push-notification.port';
import {
  NotificationHubsClient,
  createFcmLegacyNotification,
} from '@azure/notification-hubs';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class AzureNotificationHubService implements PushNotificationPort {
  private readonly logger = new Logger(AzureNotificationHubService.name);
  private readonly client: NotificationHubsClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('AZURE_NOTIFICATION_HUB_CONNECTION_STRING');
    const hubName = this.configService.get<string>('AZURE_NOTIFICATION_HUB_NAME', 'endure-notifications');

    if (connectionString) {
      this.client = new NotificationHubsClient(connectionString, hubName);
    } else {
      this.logger.warn('AZURE_NOTIFICATION_HUB_CONNECTION_STRING not configured. Push disabled.');
    }
  }

  public async send(userId: string, title: string, body: string, pushTokens: string[]): Promise<void> {
    if (!this.client) {
      this.logger.warn('Azure NH client not initialized. Skipping push.');
      return;
    }

    if (pushTokens.length === 0) {
      this.logger.warn(`No push tokens for user ${userId}. Skipping.`);
      return;
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const notification = createFcmLegacyNotification({
          body: JSON.stringify({ title, body, data: { type: 'reminder' } }),
        });

        for (const token of pushTokens) {
          await this.client.sendNotification(notification, { deviceHandle: token });
        }

        this.logger.log(`Push sent to user ${userId} (${pushTokens.length} tokens)`);
        return;
      } catch (error) {
        this.logger.error(`Push attempt ${attempt}/${maxRetries} failed for user ${userId}`, error);
        if (attempt < maxRetries) {
          await delay(1000 * Math.pow(2, attempt - 1));
        } else {
          this.logger.error(`All ${maxRetries} push attempts failed for user ${userId}`);
        }
      }
    }
  }
}

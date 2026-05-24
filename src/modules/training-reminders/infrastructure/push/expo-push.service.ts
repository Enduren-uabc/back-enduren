import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PushNotificationPort } from '../../application/ports/push-notification.port';

@Injectable()
export class ExpoPushService implements PushNotificationPort {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly expo = new Expo();

  public async send(userId: string, title: string, body: string, pushTokens: string[]): Promise<void> {
    if (pushTokens.length === 0) {
      this.logger.warn(`No push tokens for user ${userId}. Skipping.`);
      return;
    }

    const validTokens = pushTokens.filter((t) => Expo.isExpoPushToken(t));

    if (validTokens.length === 0) {
      this.logger.warn(`No valid Expo push tokens for user ${userId}. Skipping.`);
      return;
    }

    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: { type: 'reminder' },
    }));

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.log(`Push sent: ${chunk.length} notification(s) to user ${userId}`);

        for (let i = 0; i < receipts.length; i++) {
          const receipt = receipts[i];
          if (receipt.status === 'error') {
            this.logger.error(`Push error for token ${validTokens[i]}: ${receipt.message}`);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to send push chunk for user ${userId}`, error);
      }
    }
  }
}

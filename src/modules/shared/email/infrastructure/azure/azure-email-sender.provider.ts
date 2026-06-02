import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailClient } from '@azure/communication-email';
import { EmailSenderPort } from '../../domain/ports/email-sender.port';
import { EmailMessage } from '../../domain/value-objects/email-message.vo';

@Injectable()
export class AzureEmailSender implements EmailSenderPort {
  private readonly client: EmailClient;
  private readonly senderAddress: string;

  constructor(private readonly configService: ConfigService) {
    const connString = this.configService.get<string>(
      'AZURE_COMMUNICATION_CONNECTION_STRING',
    );
    if (!connString) {
      throw new Error(
        'AZURE_COMMUNICATION_CONNECTION_STRING is not configured',
      );
    }
    this.senderAddress = this.configService.get<string>(
      'AZURE_SENDER_EMAIL',
      'DoNotReply@endure.com',
    );
    this.client = new EmailClient(connString);
  }

  async sendEmail(message: EmailMessage): Promise<void> {
    const poller = await this.client.beginSend({
      senderAddress: this.senderAddress,
      content: {
        subject: message.subject,
        plainText: message.textBody,
        html: message.htmlBody,
      },
      recipients: {
        to: [{ address: message.to }],
      },
    });
    await poller.pollUntilDone();
  }
}

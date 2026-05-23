import { EmailMessage } from '../value-objects/email-message.vo';

export const EMAIL_SENDER_PORT = Symbol('EMAIL_SENDER_PORT');

export interface EmailSenderPort {
  sendEmail(message: EmailMessage): Promise<void>;
}

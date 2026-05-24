import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { ResendVerificationEvent } from '../../domain/events/resend-verification.event';
import {
  EmailSenderPort,
  EMAIL_SENDER_PORT,
} from '../../domain/ports/email-sender.port';
import { EmailMessage } from '../../domain/value-objects/email-message.vo';

@Injectable()
export class ResendVerificationListener {
  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent('resend.verification', { async: true })
  async handle(event: ResendVerificationEvent): Promise<void> {
    const htmlBody = `
      <div style="max-width:560px;margin:0 auto;font-family:sans-serif;background:#1a1a2e;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#FACC15;margin:0;">Endure</h1>
          <p style="color:#9CA3AF;margin:4px 0 0;">Tu compa\u00F1ero de entrenamiento</p>
        </div>
        <h2 style="color:#FFFFFF;text-align:center;">Nuevo código de verificación</h2>
        <p style="color:#D1D5DB;text-align:center;font-size:16px;">
          Aquí tienes tu nuevo código:
        </p>
        <div style="text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;
                    background:#16213E;color:#FACC15;padding:20px;border-radius:8px;
                    margin:24px 0;border:1px solid #FACC15;">
          ${event.verificationToken}
        </div>
        <p style="color:#6B7280;text-align:center;font-size:14px;">
          Este código expira en 24 horas.<br/>
          Si no solicitaste este código, ignora este mensaje.
        </p>
      </div>
    `;

    const textBody = `Nuevo código de verificación para Endure: ${event.verificationToken}\n\nEste código expira en 24 horas.`;

    const message = new EmailMessage(
      event.email,
      'Nuevo código de verificación - Endure',
      htmlBody,
      textBody,
    );

    try {
      await this.emailSender.sendEmail(message);
    } catch (error) {
      console.error(
        `[Email] Failed to resend verification to ${event.email}:`,
        error,
      );
    }
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import {
  EmailSenderPort,
  EMAIL_SENDER_PORT,
} from '../../domain/ports/email-sender.port';
import { EmailMessage } from '../../domain/value-objects/email-message.vo';

@Injectable()
export class UserRegisteredListener {
  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
    private readonly configService: ConfigService,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE SYSTEM NOTE:
  // Los templates inline se usan como punto de partida.
  // Cuando haya +2 tipos de correo (verificación, recuperación,
  // notificaciones), migrar a un sistema de templates externo
  // (Handlebars/Mustache con archivos .hbs en shared/email/templates/).
  // ═══════════════════════════════════════════════════════════════

  @OnEvent('user.registered', { async: true })
  async handle(event: UserRegisteredEvent): Promise<void> {
    const htmlBody = `
      <div style="max-width:560px;margin:0 auto;font-family:sans-serif;background:#1a1a2e;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#FACC15;margin:0;">Endure</h1>
          <p style="color:#9CA3AF;margin:4px 0 0;">Tu compa\u00F1ero de entrenamiento</p>
        </div>
        <h2 style="color:#FFFFFF;text-align:center;">¡Bienvenido, ${event.username}!</h2>
        <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
          Usa el siguiente código para verificar tu correo electrónico:
        </p>
        <div style="text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;
                    background:#16213E;color:#FACC15;padding:20px;border-radius:8px;
                    margin:24px 0;border:1px solid #FACC15;">
          ${event.verificationToken}
        </div>
        <p style="color:#6B7280;text-align:center;font-size:14px;">
          Este código expira en 24 horas.<br/>
          Si no creaste esta cuenta, ignora este mensaje.
        </p>
      </div>
    `;

    const textBody = `Bienvenido a Endure, ${event.username}!\n\nTu código de verificación es: ${event.verificationToken}\n\nEste código expira en 24 horas.`;

    const message = new EmailMessage(
      event.email,
      'Verifica tu correo en Endure',
      htmlBody,
      textBody,
    );

    try {
      await this.emailSender.sendEmail(message);
    } catch (error) {
      console.error(
        `[Email] Failed to send verification to ${event.email}:`,
        error,
      );
    }
  }
}

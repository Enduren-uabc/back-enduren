import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PasswordRecoveryRequestedEvent } from '../../domain/events/password-recovery-requested.event';
import {
  EmailSenderPort,
  EMAIL_SENDER_PORT,
} from '../../domain/ports/email-sender.port';
import { EmailMessage } from '../../domain/value-objects/email-message.vo';

@Injectable()
export class PasswordRecoveryListener {
  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // TEMPLATE SYSTEM NOTE:
  // Cuando haya +2 tipos de correo, migrar a Handlebars/Mustache
  // con archivos .hbs en shared/email/templates/.
  // ═══════════════════════════════════════════════════════════════

  @OnEvent('password.recovery.requested', { async: true })
  async handle(event: PasswordRecoveryRequestedEvent): Promise<void> {
    const htmlBody = `
      <div style="max-width:560px;margin:0 auto;font-family:sans-serif;background:#1a1a2e;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#FACC15;margin:0;">Endure</h1>
          <p style="color:#9CA3AF;margin:4px 0 0;">Tu compa\u00F1ero de entrenamiento</p>
        </div>
        <h2 style="color:#FFFFFF;text-align:center;">Recuperaci\u00F3n de contrase\u00F1a</h2>
        <p style="color:#D1D5DB;text-align:center;font-size:16px;">
          Usa el siguiente c\u00F3digo para restablecer tu contrase\u00F1a:
        </p>
        <div style="text-align:center;font-size:32px;letter-spacing:8px;font-weight:bold;
                    background:#16213E;color:#FACC15;padding:20px;border-radius:8px;
                    margin:24px 0;border:1px solid #FACC15;">
          ${event.verificationToken}
        </div>
        <p style="color:#6B7280;text-align:center;font-size:14px;">
          Este c\u00F3digo expira en 30 minutos.<br/>
          Si no solicitaste esta recuperaci\u00F3n, ignora este mensaje.
        </p>
      </div>
    `;

    const textBody = `Recuperacion de contrasena - Endure\n\nTu codigo de recuperacion es: ${event.verificationToken}\n\nEste codigo expira en 30 minutos.`;

    const message = new EmailMessage(
      event.email,
      'Recuperación de contraseña - Endure',
      htmlBody,
      textBody,
    );

    try {
      await this.emailSender.sendEmail(message);
    } catch (error) {
      console.error(
        `[Email] Failed to send password recovery to ${event.email}:`,
        error,
      );
    }
  }
}

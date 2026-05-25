import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TrainerVerificationSubmittedEvent } from '../../domain/events/trainer-verification-submitted.event';
import {
  EmailSenderPort,
  EMAIL_SENDER_PORT,
} from '../../domain/ports/email-sender.port';
import { EmailMessage } from '../../domain/value-objects/email-message.vo';

@Injectable()
export class TrainerVerificationSubmittedListener {
  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
  ) {}

  @OnEvent('trainer-verification.submitted', { async: true })
  async handle(event: TrainerVerificationSubmittedEvent): Promise<void> {
    const htmlBody = `
      <div style="max-width:560px;margin:0 auto;font-family:sans-serif;background:#1a1a2e;padding:32px;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#FACC15;margin:0;">Endure</h1>
          <p style="color:#9CA3AF;margin:4px 0 0;">Tu compa\u00F1ero de entrenamiento</p>
        </div>
        <h2 style="color:#FFFFFF;text-align:center;">¡Hemos recibido tu solicitud!</h2>
        <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
          Gracias por tu inter\u00E9s en convertirte en entrenador en Endure.
          Hemos recibido tu solicitud y nuestros revisores la evaluar\u00E1n pronto.
        </p>
        <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
          Te notificaremos por correo electr\u00F3nico cuando haya una actualizaci\u00F3n
          sobre el estado de tu solicitud.
        </p>
        <div style="text-align:center;margin-top:24px;padding:16px;background:#16213E;border-radius:8px;border:1px solid #FACC15;">
          <p style="color:#FACC15;margin:0;font-size:14px;">
            El equipo de Endure
          </p>
        </div>
      </div>
    `;

    const textBody =
      `Hemos recibido tu solicitud de entrenador en Endure.\n\n` +
      `Gracias por tu interés. Nuestro equipo la evaluará pronto y te notificaremos cualquier actualización por correo electrónico.\n\n` +
      `El equipo de Endure`;

    const message = new EmailMessage(
      event.email,
      'Hemos recibido tu solicitud de entrenador — Endure',
      htmlBody,
      textBody,
    );

    try {
      await this.emailSender.sendEmail(message);
    } catch (error) {
      console.error(
        `[Email] Failed to send trainer verification submitted to ${event.email}:`,
        error,
      );
    }
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TrainerVerificationReviewedEvent } from '../../domain/events/trainer-verification-reviewed.event';
import {
  EmailSenderPort,
  EMAIL_SENDER_PORT,
} from '../../domain/ports/email-sender.port';
import { EmailMessage } from '../../domain/value-objects/email-message.vo';

@Injectable()
export class TrainerVerificationReviewedListener {
  constructor(
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
  ) {}

  @OnEvent('trainer-verification.reviewed', { async: true })
  async handle(event: TrainerVerificationReviewedEvent): Promise<void> {
    const subject = this.getSubject(event.decision);
    const htmlBody = this.buildHtml(event);
    const textBody = this.buildText(event);

    const message = new EmailMessage(event.email, subject, htmlBody, textBody);

    try {
      await this.emailSender.sendEmail(message);
    } catch (error) {
      console.error(
        `[Email] Failed to send trainer verification reviewed to ${event.email}:`,
        error,
      );
    }
  }

  private getSubject(decision: string): string {
    switch (decision) {
      case 'approved':
        return '¡Felicidades! Tu solicitud de entrenador fue aprobada — Endure';
      case 'rejected':
        return 'Actualización sobre tu solicitud de entrenador — Endure';
      case 'correction_required':
        return 'Tu solicitud de entrenador necesita correcciones — Endure';
      default:
        return 'Actualización sobre tu solicitud de entrenador — Endure';
    }
  }

  private buildHtml(event: TrainerVerificationReviewedEvent): string {
    const headerImage = `
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#FACC15;margin:0;">Endure</h1>
        <p style="color:#9CA3AF;margin:4px 0 0;">Tu compa\u00F1ero de entrenamiento</p>
      </div>
    `;

    switch (event.decision) {
      case 'approved':
        return `
          <div style="max-width:560px;margin:0 auto;font-family:sans-serif;background:#1a1a2e;padding:32px;border-radius:12px;">
            ${headerImage}
            <h2 style="color:#FFFFFF;text-align:center;">¡Felicidades, ${event.username}!</h2>
            <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
              Tu solicitud para convertirte en entrenador de Endure ha sido
              <span style="color:#22C55E;font-weight:bold;">aprobada</span>.
            </p>
            <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
              Ya puedes acceder a las funciones de entrenador desde la aplicaci\u00F3n.
            </p>
            <div style="text-align:center;margin-top:24px;padding:16px;background:#16213E;border-radius:8px;border:1px solid #FACC15;">
              <p style="color:#FACC15;margin:0;font-size:14px;">
                El equipo de Endure
              </p>
            </div>
          </div>
        `;

      case 'rejected':
        return `
          <div style="max-width:560px;margin:0 auto;font-family:sans-serif;background:#1a1a2e;padding:32px;border-radius:12px;">
            ${headerImage}
            <h2 style="color:#FFFFFF;text-align:center;">Hola, ${event.username}</h2>
            <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
              Lamentablemente, tu solicitud para convertirte en entrenador ha sido
              <span style="color:#EF4444;font-weight:bold;">rechazada</span>.
            </p>
            ${event.message ? `<p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">Motivo: ${event.message}</p>` : ''}
            <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
              Puedes volver a enviar tu solicitud realizando las correcciones necesarias.
            </p>
            <div style="text-align:center;margin-top:24px;padding:16px;background:#16213E;border-radius:8px;border:1px solid #FACC15;">
              <p style="color:#FACC15;margin:0;font-size:14px;">
                El equipo de Endure
              </p>
            </div>
          </div>
        `;

      case 'correction_required':
        return `
          <div style="max-width:560px;margin:0 auto;font-family:sans-serif;background:#1a1a2e;padding:32px;border-radius:12px;">
            ${headerImage}
            <h2 style="color:#FFFFFF;text-align:center;">Hola, ${event.username}</h2>
            <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
              Tu solicitud de entrenador requiere
              <span style="color:#FACC15;font-weight:bold;">correcciones</span>
              antes de poder ser aprobada.
            </p>
            ${event.message ? `<p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">${event.message}</p>` : ''}
            <p style="color:#D1D5DB;text-align:center;font-size:16px;line-height:24px;">
              Por favor, realiza los cambios necesarios y vuelve a enviar tu solicitud desde la aplicaci\u00F3n.
            </p>
            <div style="text-align:center;margin-top:24px;padding:16px;background:#16213E;border-radius:8px;border:1px solid #FACC15;">
              <p style="color:#FACC15;margin:0;font-size:14px;">
                El equipo de Endure
              </p>
            </div>
          </div>
        `;

      default:
        return '';
    }
  }

  private buildText(event: TrainerVerificationReviewedEvent): string {
    const base = `Hola ${event.username},\n\n`;

    switch (event.decision) {
      case 'approved':
        return (
          base +
          `¡Felicidades! Tu solicitud para convertirte en entrenador de Endure ha sido aprobada.\n\n` +
          `Ya puedes acceder a las funciones de entrenador desde la aplicación.\n\n` +
          `El equipo de Endure`
        );

      case 'rejected':
        return (
          base +
          `Lamentablemente, tu solicitud para convertirte en entrenador ha sido rechazada.\n` +
          (event.message ? `Motivo: ${event.message}\n\n` : `\n`) +
          `Puedes volver a enviar tu solicitud realizando las correcciones necesarias.\n\n` +
          `El equipo de Endure`
        );

      case 'correction_required':
        return (
          base +
          `Tu solicitud de entrenador requiere correcciones antes de poder ser aprobada.\n` +
          (event.message ? `${event.message}\n\n` : `\n`) +
          `Realiza los cambios necesarios y vuelve a enviar tu solicitud desde la aplicación.\n\n` +
          `El equipo de Endure`
        );

      default:
        return base + `El equipo de Endure`;
    }
  }
}

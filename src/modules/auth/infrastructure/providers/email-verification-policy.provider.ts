import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../../../users/domain/entities/user.entity';

/**
 * Código fijo que /auth/verify-email acepta cuando el bypass de desarrollo
 * está activo. No debe usarse en producción.
 */
export const DEV_EMAIL_VERIFICATION_CODE = '000000';

/**
 * TASK-012 DEV BYPASS
 *
 * Centraliza la decisión de omitir la verificación de correo durante el
 * desarrollo, mientras no exista el servicio de envío de correos.
 *
 * Activar con AUTH_EMAIL_VERIFICATION_DISABLED=true en back-enduren/.env.
 * Al integrar el servicio de correo: dejar la bandera ausente o en false,
 * eliminar este provider y restaurar el flujo original marcado con
 * "TASK-012 DEV BYPASS" en los casos de uso de auth.
 */
@Injectable()
export class EmailVerificationPolicy {
  constructor(private readonly configService: ConfigService) {}

  /** true solo si la bandera de desarrollo está explícitamente activa. */
  public isDisabled(): boolean {
    return (
      this.configService.get<string>(
        'AUTH_EMAIL_VERIFICATION_DISABLED',
        'false',
      ) === 'true'
    );
  }

  /** En modo desarrollo toda cuenta se considera verificada. */
  public resolveEmailVerified(user: User): boolean {
    return this.isDisabled() ? true : user.emailVerified;
  }

  /** Código fijo de desarrollo aceptado por /auth/verify-email. */
  public isDevVerificationCode(token: string): boolean {
    return this.isDisabled() && token === DEV_EMAIL_VERIFICATION_CODE;
  }
}

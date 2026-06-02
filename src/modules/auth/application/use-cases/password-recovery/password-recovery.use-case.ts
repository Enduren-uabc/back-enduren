import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
import {
  PasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY_PORT,
} from '../../../domain/repositories/password-reset-token.repository';
import { PasswordResetToken } from '../../../domain/entities/password-reset-token.entity';
import { PasswordRecoveryRequestedEvent } from '../../../../shared/email/domain/events/password-recovery-requested.event';

export interface PasswordRecoveryInput {
  email: string;
}

export interface PasswordRecoveryOutput {
  message: string;
}

@Injectable()
export class PasswordRecoveryUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY_PORT)
    private readonly tokenRepository: PasswordResetTokenRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: PasswordRecoveryInput): Promise<PasswordRecoveryOutput> {
    const email = input.email.toLowerCase().trim();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException('El correo ingresado no está registrado');
    }

    await this.tokenRepository.deleteByUserId(user.id);

    const tokenValue = String(Math.floor(100000 + Math.random() * 900000)); // sonarqube:prng-safe-context
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const resetToken = PasswordResetToken.create(
      user.id,
      tokenValue,
      expiresAt,
    );
    await this.tokenRepository.save(resetToken);

    this.eventEmitter.emit(
      'password.recovery.requested',
      new PasswordRecoveryRequestedEvent(
        user.id,
        user.email,
        user.username,
        tokenValue,
      ),
    );

    return {
      message:
        'Si el correo está registrado, recibirás un código de recuperación',
    };
  }
}

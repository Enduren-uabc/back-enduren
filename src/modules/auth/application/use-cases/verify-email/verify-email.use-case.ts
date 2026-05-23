import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
import {
  EmailVerificationTokenRepository,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT,
} from '../../../domain/repositories/email-verification-token.repository';
import { UserRegisteredEvent } from '../../../../shared/email/domain/events/user-registered.event';

export interface VerifyEmailInput {
  token: string;
}

export interface VerifyEmailOutput {
  verified: boolean;
}

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT)
    private readonly tokenRepository: EmailVerificationTokenRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const verificationToken = await this.tokenRepository.findByToken(input.token);

    if (!verificationToken) {
      throw new BadRequestException('Código inválido');
    }

    if (verificationToken.usedAt !== null) {
      throw new BadRequestException('Este código ya fue utilizado');
    }

    if (verificationToken.isExpired()) {
      throw new BadRequestException('Código expirado. Solicita uno nuevo.');
    }

    const user = await this.userRepository.findById(verificationToken.userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El correo ya está verificado');
    }

    user.verifyEmail();
    await this.userRepository.save(user);

    verificationToken.markAsUsed();
    await this.tokenRepository.save(verificationToken);

    return { verified: true };
  }
}

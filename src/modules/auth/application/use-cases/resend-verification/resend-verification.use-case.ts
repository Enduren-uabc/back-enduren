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
import { EmailVerificationToken } from '../../../domain/entities/email-verification-token.entity';
import { ResendVerificationEvent } from '../../../../shared/email/domain/events/resend-verification.event';

export interface ResendVerificationInput {
  userId: string;
}

export interface ResendVerificationOutput {
  message: string;
}

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT)
    private readonly tokenRepository: EmailVerificationTokenRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: ResendVerificationInput,
  ): Promise<ResendVerificationOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.emailVerified) {
      throw new BadRequestException('El correo ya está verificado');
    }

    await this.tokenRepository.deleteByUserId(user.id);

    const tokenValue = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const verificationToken = EmailVerificationToken.create(
      user.id,
      tokenValue,
      expiresAt,
    );
    await this.tokenRepository.save(verificationToken);

    this.eventEmitter.emit(
      'resend.verification',
      new ResendVerificationEvent(
        user.id,
        user.email,
        user.username,
        tokenValue,
      ),
    );

    return { message: 'Código reenviado' };
  }
}

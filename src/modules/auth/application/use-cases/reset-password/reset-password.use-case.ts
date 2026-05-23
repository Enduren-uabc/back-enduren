import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
import {
  PasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY_PORT,
} from '../../../domain/repositories/password-reset-token.repository';
import {
  PasswordHasher,
  PASSWORD_HASHER_PORT,
} from '../../../infrastructure/providers/password-hasher.provider';

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface ResetPasswordOutput {
  message: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY_PORT)
    private readonly tokenRepository: PasswordResetTokenRepository,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    const resetToken = await this.tokenRepository.findByToken(input.token);

    if (!resetToken) {
      throw new BadRequestException('Código inválido');
    }

    if (resetToken.usedAt !== null) {
      throw new BadRequestException('Este código ya fue utilizado');
    }

    if (resetToken.isExpired()) {
      throw new BadRequestException('Código expirado. Solicita uno nuevo.');
    }

    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    user.updatePassword(passwordHash);
    await this.userRepository.save(user);

    resetToken.markAsUsed();
    await this.tokenRepository.save(resetToken);

    return { message: 'Contraseña actualizada correctamente' };
  }
}

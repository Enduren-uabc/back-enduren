import { Injectable, Inject } from '@nestjs/common';
import {
  PasswordResetTokenRepository,
  PASSWORD_RESET_TOKEN_REPOSITORY_PORT,
} from '../../../domain/repositories/password-reset-token.repository';

export interface ValidateResetTokenInput {
  token: string;
}

export interface ValidateResetTokenOutput {
  valid: boolean;
}

@Injectable()
export class ValidateResetTokenUseCase {
  constructor(
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY_PORT)
    private readonly tokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(input: ValidateResetTokenInput): Promise<ValidateResetTokenOutput> {
    if (!input.token) {
      return { valid: false };
    }

    const resetToken = await this.tokenRepository.findByToken(input.token);

    if (!resetToken) {
      return { valid: false };
    }

    if (resetToken.usedAt !== null) {
      return { valid: false };
    }

    if (resetToken.isExpired()) {
      return { valid: false };
    }

    return { valid: true };
  }
}

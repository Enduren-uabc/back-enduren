import { Injectable, Inject } from '@nestjs/common';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY_PORT } from '../../../domain/repositories/refresh-token.repository';

@Injectable()
export class LogoutUserUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenRepository.deleteByToken(refreshToken);
    }
  }
}

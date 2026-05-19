import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  RefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY_PORT,
} from '../../../domain/repositories/refresh-token.repository';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(tokenValue: string): Promise<RefreshTokenOutput> {
    const stored = await this.refreshTokenRepository.findByToken(tokenValue);
    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.isExpired() || stored.isUsed()) {
      throw new UnauthorizedException('Refresh token expired or already used');
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Mark old refresh token as used (rotation)
    stored.markAsUsed();
    await this.refreshTokenRepository.save(stored);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRATION',
        '15m',
      ) as `${number}m`,
    });

    // Rotate refresh token
    const newRefreshTokenValue = crypto.randomUUID();
    const refreshExpiresDays = parseInt(
      this.configService
        .get<string>('JWT_REFRESH_EXPIRATION', '7d')
        .replace('d', ''),
      10,
    );

    const { RefreshToken } =
      await import('../../../domain/entities/refresh-token.entity');
    const newRefreshToken = RefreshToken.create(
      crypto.randomUUID(),
      newRefreshTokenValue,
      user.id,
      new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000),
    );
    await this.refreshTokenRepository.save(newRefreshToken);

    return { accessToken, refreshToken: newRefreshTokenValue };
  }
}

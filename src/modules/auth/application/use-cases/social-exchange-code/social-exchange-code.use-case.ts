import { Injectable, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository, USER_REPOSITORY_PORT } from '../../../../users/domain/repositories/user.repository';
import { RefreshTokenRepository, REFRESH_TOKEN_REPOSITORY_PORT } from '../../../domain/repositories/refresh-token.repository';
import { SocialAuthCodeRepository, SOCIAL_AUTH_CODE_REPOSITORY_PORT } from '../../../domain/repositories/social-auth-code.repository';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';

export interface ExchangeCodeInput {
  code: string;
}

export interface ExchangeCodeOutput {
  user: { id: string; email: string; username: string; role: string; emailVerified: boolean };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class SocialExchangeCodeUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(SOCIAL_AUTH_CODE_REPOSITORY_PORT)
    private readonly authCodeRepository: SocialAuthCodeRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: ExchangeCodeInput): Promise<ExchangeCodeOutput> {
    const authCode = await this.authCodeRepository.findByCode(input.code);

    if (!authCode) {
      throw new BadRequestException('Código inválido.');
    }

    if (authCode.isExpired()) {
      throw new BadRequestException('El código ha expirado. Inicia sesión nuevamente.');
    }

    if (authCode.usedAt !== null) {
      throw new BadRequestException('Este código ya fue utilizado.');
    }

    const user = await this.userRepository.findById(authCode.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    if (user.status === 'locked') {
      throw new UnauthorizedException('La cuenta está bloqueada. Intenta más tarde.');
    }

    authCode.markAsUsed();
    await this.authCodeRepository.save(authCode);

    await this.refreshTokenRepository.deleteByUserId(user.id);

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  }

  private async generateTokens(user: { id: string; email: string; role: string; emailVerified: boolean }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m') as `${number}m`,
    });

    const refreshTokenValue = crypto.randomUUID();
    const refreshExpiresDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d').replace('d', ''),
      10,
    );
    const refreshToken = RefreshToken.create(
      crypto.randomUUID(),
      refreshTokenValue,
      user.id,
      new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000),
    );
    await this.refreshTokenRepository.save(refreshToken);

    return { accessToken, refreshToken: refreshTokenValue };
  }
}

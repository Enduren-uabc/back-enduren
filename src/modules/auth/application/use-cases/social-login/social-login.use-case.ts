import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
import {
  RefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY_PORT,
} from '../../../domain/repositories/refresh-token.repository';
import {
  SocialAuthVerifierPort,
  SOCIAL_AUTH_VERIFIER_PORT,
} from '../../ports/social-auth-verifier.port';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { User } from '../../../../users/domain/entities/user.entity';
import { UserDomainError } from '../../../../users/domain/errors/user-domain.error';

export interface SocialLoginInput {
  provider: 'google' | 'apple';
  idToken: string;
  privacyAccepted: boolean;
}

export interface SocialLoginOutput {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class SocialLoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(SOCIAL_AUTH_VERIFIER_PORT)
    private readonly socialAuthVerifier: SocialAuthVerifierPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: SocialLoginInput): Promise<SocialLoginOutput> {
    if (!input.privacyAccepted) {
      throw new BadRequestException(
        'Debes aceptar el aviso de privacidad para continuar',
      );
    }

    let socialData;
    try {
      socialData = await this.socialAuthVerifier.verify(
        input.provider,
        input.idToken,
      );
    } catch {
      throw new UnauthorizedException('El token de autenticación no es válido');
    }

    let user = await this.userRepository.findBySocialId(
      input.provider,
      socialData.socialId,
    );

    if (user) {
      user.updateFromSocial(
        socialData.email,
        socialData.name,
        socialData.avatarUrl,
      );
      await this.userRepository.save(user);
    } else {
      user = await this.createSocialUser(input.provider, socialData);
    }

    if (user.status === 'locked') {
      throw new UnauthorizedException(
        'La cuenta está bloqueada. Intenta más tarde.',
      );
    }

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

  private async createSocialUser(
    provider: 'google' | 'apple',
    socialData: {
      socialId: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    },
  ): Promise<User> {
    const existingByEmail = await this.userRepository.findByEmail(
      socialData.email,
    );
    if (existingByEmail) {
      existingByEmail.authProvider = provider;
      existingByEmail.socialId = socialData.socialId;
      existingByEmail.privacyAccepted = true;
      if (socialData.avatarUrl) {
        existingByEmail.avatarUrl = socialData.avatarUrl;
      }
      existingByEmail.emailVerified = true;
      await this.userRepository.save(existingByEmail);
      return existingByEmail;
    }

    const username = await this.generateUniqueUsername(
      socialData.name,
      socialData.email,
    );

    const user = User.createFromSocial(
      crypto.randomUUID(),
      socialData.email,
      username,
      provider,
      socialData.socialId,
      socialData.avatarUrl,
    );
    await this.userRepository.save(user);
    return user;
  }

  private async generateUniqueUsername(
    name: string,
    email: string,
  ): Promise<string> {
    const base = email
      .split('@')[0]
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .substring(0, 30);
    let username = base;
    let attempts = 0;
    while (attempts < 20) {
      if (!(await this.userRepository.existsByUsername(username))) {
        return username;
      }
      attempts++;
      const suffix = Math.floor(Math.random() * 10000); // sonarqube:prng-safe-context
      username = `${base.substring(0, 25)}_${suffix}`;
    }
    return `${base}_${Date.now()}`;
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_EXPIRATION',
        '15m',
      ) as `${number}m`,
    });

    const refreshTokenValue = crypto.randomUUID();
    const refreshExpiresDays = parseInt(
      this.configService
        .get<string>('JWT_REFRESH_EXPIRATION', '7d')
        .replace('d', ''),
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

import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
import {
  PasswordHasher,
  PASSWORD_HASHER_PORT,
} from '../../../infrastructure/providers/password-hasher.provider';
import {
  RefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY_PORT,
} from '../../../domain/repositories/refresh-token.repository';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { User } from '../../../../users/domain/entities/user.entity';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
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
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(
      input.email.toLowerCase().trim(),
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'locked') {
      throw new UnauthorizedException(
        'Account is locked. Please try again later.',
      );
    }

    const valid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
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

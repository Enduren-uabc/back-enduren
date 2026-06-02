import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { User, UserRole } from '../../../../users/domain/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import {
  EmailVerificationTokenRepository,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT,
} from '../../../domain/repositories/email-verification-token.repository';
import { EmailVerificationToken } from '../../../domain/entities/email-verification-token.entity';
import { UserRegisteredEvent } from '../../../../shared/email/domain/events/user-registered.event';
import { SOCIAL_PROFILE_REPOSITORY_PORT } from '../../../../profile/application/use-cases/follow-profile/follow-profile.use-case';
import { SocialProfileRepository } from '../../../../profile/domain/repositories/social-profile.repository';
import { SocialProfile } from '../../../../profile/domain/entities/social-profile.entity';

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  role?: 'trainer' | 'user';
}

export interface RegisterOutput {
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
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER_PORT)
    private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT)
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(SOCIAL_PROFILE_REPOSITORY_PORT)
    private readonly socialProfileRepository: SocialProfileRepository,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const email = input.email.toLowerCase().trim();
    const username = input.username.trim();

    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) {
      throw new ConflictException({
        statusCode: 409,
        code: 'USER_EMAIL_ALREADY_EXISTS',
        message: 'Este correo electrónico ya está registrado.',
      });
    }

    const usernameExists = await this.userRepository.existsByUsername(username);
    if (usernameExists) {
      throw new ConflictException({
        statusCode: 409,
        code: 'USER_USERNAME_ALREADY_EXISTS',
        message: 'Este nombre de usuario ya está en uso.',
      });
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const role: UserRole = input.role ?? 'user';
    const user = User.create(
      crypto.randomUUID(),
      email,
      username,
      passwordHash,
      role,
    );
    const saved = await this.userRepository.save(user);

    const socialProfile = SocialProfile.create(
      saved.id,
      username,
      `@${username}`,
    );
    await this.socialProfileRepository.save(socialProfile);

    const tokenValue = String(Math.floor(100000 + Math.random() * 900000)); // sonarqube:prng-safe-context
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const verificationToken = EmailVerificationToken.create(
      saved.id,
      tokenValue,
      expiresAt,
    );
    await this.emailVerificationTokenRepository.save(verificationToken);

    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent(
        saved.id,
        saved.email,
        saved.username,
        tokenValue,
      ),
    );

    const tokens = await this.generateTokens(saved);
    return {
      user: {
        id: saved.id,
        email: saved.email,
        username: saved.username,
        role: saved.role,
        emailVerified: saved.emailVerified,
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

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshTokenTypeormEntity } from './infrastructure/persistence/typeorm/entities/refresh-token-typeorm.entity';
import { EmailVerificationTokenTypeormEntity } from './infrastructure/persistence/typeorm/entities/email-verification-token-typeorm.entity';
import { PasswordResetTokenTypeormEntity } from './infrastructure/persistence/typeorm/entities/password-reset-token-typeorm.entity';
import { TypeormRefreshTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository';
import { TypeormEmailVerificationTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-email-verification-token.repository';
import { TypeormPasswordResetTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-password-reset-token.repository';
import { REFRESH_TOKEN_REPOSITORY_PORT } from './domain/repositories/refresh-token.repository';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT } from './domain/repositories/email-verification-token.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY_PORT } from './domain/repositories/password-reset-token.repository';
import {
  PASSWORD_HASHER_PORT,
  BcryptPasswordHasher,
} from './infrastructure/providers/password-hasher.provider';
import {
  COOKIE_HELPER_PORT,
  AuthCookieHelper,
} from './infrastructure/providers/cookie-helper.provider';
import { JwtStrategy } from './presentation/http/strategies/jwt.strategy';
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard';
import { RegisterUserUseCase } from './application/use-cases/register-user/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user/login-user.use-case';
import { LogoutUserUseCase } from './application/use-cases/logout-user/logout-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token/refresh-token.use-case';
import { CheckTokenUseCase } from './application/use-cases/check-token/check-token.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email/verify-email.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification/resend-verification.use-case';
import { PasswordRecoveryUseCase } from './application/use-cases/password-recovery/password-recovery.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password/reset-password.use-case';
import { ValidateResetTokenUseCase } from './application/use-cases/validate-reset-token/validate-reset-token.use-case';
import { AdminSeeder } from './infrastructure/providers/admin-seeder.service';
import { AuthController } from './presentation/http/controllers/auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_ACCESS_EXPIRATION',
            '15m',
          ) as `${number}m`,
        },
      }),
    }),
    TypeOrmModule.forFeature([
      RefreshTokenTypeormEntity,
      EmailVerificationTokenTypeormEntity,
      PasswordResetTokenTypeormEntity,
    ]),
    EventEmitterModule,
    UsersModule,
  ],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: REFRESH_TOKEN_REPOSITORY_PORT,
      useClass: TypeormRefreshTokenRepository,
    },
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY_PORT,
      useClass: TypeormEmailVerificationTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY_PORT,
      useClass: TypeormPasswordResetTokenRepository,
    },
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: COOKIE_HELPER_PORT,
      useClass: AuthCookieHelper,
    },
    RegisterUserUseCase,
    LoginUserUseCase,
    LogoutUserUseCase,
    RefreshTokenUseCase,
    CheckTokenUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    PasswordRecoveryUseCase,
    ResetPasswordUseCase,
    ValidateResetTokenUseCase,
    AdminSeeder,
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, PassportModule, JwtModule, PASSWORD_HASHER_PORT],
})
export class AuthModule {}

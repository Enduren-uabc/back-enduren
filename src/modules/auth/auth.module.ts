import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RefreshTokenTypeormEntity } from './infrastructure/persistence/typeorm/entities/refresh-token-typeorm.entity';
import { TypeormRefreshTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository';
import { REFRESH_TOKEN_REPOSITORY_PORT } from './domain/repositories/refresh-token.repository';
import { PASSWORD_HASHER_PORT, BcryptPasswordHasher } from './infrastructure/providers/password-hasher.provider';
import { COOKIE_HELPER_PORT, AuthCookieHelper } from './infrastructure/providers/cookie-helper.provider';
import { JwtStrategy } from './presentation/http/strategies/jwt.strategy';
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard';
import { RegisterUserUseCase } from './application/use-cases/register-user/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user/login-user.use-case';
import { LogoutUserUseCase } from './application/use-cases/logout-user/logout-user.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token/refresh-token.use-case';
import { CheckTokenUseCase } from './application/use-cases/check-token/check-token.use-case';
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
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRATION', '15m') as `${number}m`,
        },
      }),
    }),
    TypeOrmModule.forFeature([RefreshTokenTypeormEntity]),
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
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, PassportModule, JwtModule, PASSWORD_HASHER_PORT],
})
export class AuthModule {}

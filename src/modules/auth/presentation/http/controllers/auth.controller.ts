import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../strategies/jwt.strategy';
import {
  CookieHelper,
  COOKIE_HELPER_PORT,
} from '../../../infrastructure/providers/cookie-helper.provider';
import { GoogleOAuthService } from '../../../infrastructure/providers/google-oauth.service';
import { OAuthStateStore } from '../../../infrastructure/providers/oauth-state.store';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user/register-user.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user/login-user.use-case';
import { LogoutUserUseCase } from '../../../application/use-cases/logout-user/logout-user.use-case';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token/refresh-token.use-case';
import { CheckTokenUseCase } from '../../../application/use-cases/check-token/check-token.use-case';
import { VerifyEmailUseCase } from '../../../application/use-cases/verify-email/verify-email.use-case';
import { ResendVerificationUseCase } from '../../../application/use-cases/resend-verification/resend-verification.use-case';
import { PasswordRecoveryUseCase } from '../../../application/use-cases/password-recovery/password-recovery.use-case';
import { ResetPasswordUseCase } from '../../../application/use-cases/reset-password/reset-password.use-case';
import { ValidateResetTokenUseCase } from '../../../application/use-cases/validate-reset-token/validate-reset-token.use-case';
import { SocialLoginUseCase } from '../../../application/use-cases/social-login/social-login.use-case';
import { SocialExchangeCodeUseCase } from '../../../application/use-cases/social-exchange-code/social-exchange-code.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { PasswordRecoveryDto } from '../dtos/password-recovery.dto';
import { PasswordResetDto } from '../dtos/password-reset.dto';
import { SocialLoginDto } from '../dtos/social-login.dto';
import { ExchangeSocialCodeDto } from '../dtos/exchange-social-code.dto';
import { AuthResponseDto } from '../dtos/auth.response';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
import { User } from '../../../../users/domain/entities/user.entity';
import {
  SocialAuthCodeRepository,
  SOCIAL_AUTH_CODE_REPOSITORY_PORT,
} from '../../../domain/repositories/social-auth-code.repository';
import { SocialAuthCode } from '../../../domain/entities/social-auth-code.entity';
import { ConfigService } from '@nestjs/config';

const ALLOWED_RETURN_SCHEMES = [
  'com.endure.app://',
  'exp://',
  'http://localhost',
  'https://localhost',
];

function generateTempCode(length = 32): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUserUseCase,
    private readonly logoutUseCase: LogoutUserUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly checkTokenUseCase: CheckTokenUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly passwordRecoveryUseCase: PasswordRecoveryUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly validateResetTokenUseCase: ValidateResetTokenUseCase,
    private readonly socialLoginUseCase: SocialLoginUseCase,
    private readonly socialExchangeCodeUseCase: SocialExchangeCodeUseCase,
    @Inject(COOKIE_HELPER_PORT)
    private readonly cookieHelper: CookieHelper,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly oauthStateStore: OAuthStateStore,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
    @Inject(SOCIAL_AUTH_CODE_REPOSITORY_PORT)
    private readonly authCodeRepository: SocialAuthCodeRepository,
    private readonly configService: ConfigService,
  ) {}

  private isMobileClient(req: Request): boolean {
    return req.headers['x-client-type'] === 'mobile';
  }

  private buildAuthResponse(
    result: {
      user: {
        id: string;
        email: string;
        username: string;
        role: string;
        emailVerified: boolean;
      };
      accessToken: string;
      refreshToken: string;
    },
    isMobile: boolean,
  ): AuthResponseDto {
    const response = new AuthResponseDto();
    response.id = result.user.id;
    response.email = result.user.email;
    response.username = result.user.username;
    response.role = result.user.role;
    response.emailVerified = result.user.emailVerified;
    if (isMobile) {
      response.accessToken = result.accessToken;
      response.refreshToken = result.refreshToken;
    }
    return response;
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const result = await this.registerUseCase.execute(dto);
    this.cookieHelper.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
    );
    return this.buildAuthResponse(result, this.isMobileClient(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const result = await this.loginUseCase.execute(dto);
    this.cookieHelper.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
    );
    return this.buildAuthResponse(result, this.isMobileClient(req));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ): Promise<{ success: boolean }> {
    const refreshToken = req.cookies?.refresh_token ?? body?.refreshToken;
    if (refreshToken) {
      await this.logoutUseCase.execute(refreshToken);
    }
    this.cookieHelper.clearAuthCookies(res);
    return { success: true };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
  }> {
    const refreshToken = req.cookies?.refresh_token ?? body?.refreshToken;
    if (!refreshToken) {
      this.cookieHelper.clearAuthCookies(res);
      return { success: false };
    }
    const result = await this.refreshUseCase.execute(refreshToken);
    this.cookieHelper.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
    );
    if (this.isMobileClient(req)) {
      return {
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    }
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() user: JwtPayload): Promise<AuthResponseDto | null> {
    const result = await this.checkTokenUseCase.execute(user.sub);
    if (!result) {
      return null;
    }
    const response = new AuthResponseDto();
    response.id = result.id;
    response.email = result.email;
    response.username = result.username;
    response.role = result.role;
    response.emailVerified = result.emailVerified;
    return response;
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() body: { token: string },
  ): Promise<{ verified: boolean }> {
    return this.verifyEmailUseCase.execute({ token: body.token });
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    return this.resendVerificationUseCase.execute({ userId: user.sub });
  }

  @Public()
  @Post('password-recovery')
  @HttpCode(HttpStatus.OK)
  async passwordRecovery(
    @Body() dto: PasswordRecoveryDto,
  ): Promise<{ message: string }> {
    return this.passwordRecoveryUseCase.execute(dto);
  }

  @Public()
  @Get('password-reset/validate')
  @HttpCode(HttpStatus.OK)
  async validatePasswordResetToken(
    @Query('token') token: string,
  ): Promise<{ valid: boolean }> {
    return this.validateResetTokenUseCase.execute({ token });
  }

  @Public()
  @Post('social-login')
  @HttpCode(HttpStatus.OK)
  async socialLogin(
    @Body() dto: SocialLoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const result = await this.socialLoginUseCase.execute(dto);
    this.cookieHelper.setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
    );
    return this.buildAuthResponse(result, this.isMobileClient(req));
  }

  @Public()
  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async passwordReset(
    @Body() dto: PasswordResetDto,
  ): Promise<{ message: string }> {
    return this.resetPasswordUseCase.execute(dto);
  }

  @Public()
  @Get('google')
  @HttpCode(HttpStatus.FOUND)
  async googleAuth(
    @Query('returnTo') returnTo: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!returnTo) {
      res.status(400).json({ message: 'Falta el parámetro returnTo.' });
      return;
    }

    const allowed = ALLOWED_RETURN_SCHEMES.some((s) => returnTo.startsWith(s));
    if (!allowed) {
      this.logger.warn(`returnTo inválido rechazado: ${returnTo}`);
      res
        .status(400)
        .json({ message: 'returnTo inválido. Esquema no permitido.' });
      return;
    }

    if (!this.googleOAuthService.configured) {
      this.logger.error(
        'Google OAuth no está configurado. Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET',
      );
      res
        .status(500)
        .json({ message: 'La autenticación con Google no está configurada.' });
      return;
    }

    const state = crypto.randomUUID();
    this.oauthStateStore.set(state, returnTo);

    const authUrl = this.googleOAuthService.generateAuthUrl(state);
    this.logger.log(
      `Iniciando OAuth Google, state=${state.substring(0, 8)}..., returnTo=${returnTo}`,
    );

    res.redirect(authUrl);
  }

  @Public()
  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (error) {
      this.logger.warn(`Google OAuth error: ${error}`);
      const returnTo = state ? this.oauthStateStore.getAndDelete(state) : null;
      res.redirect(`${returnTo || 'com.endure.app://'}?error=${error}`);
      return;
    }

    if (!code || !state) {
      this.logger.warn('Callback Google sin code o state');
      res.status(400).json({ message: 'Faltan parámetros code o state.' });
      return;
    }

    const returnTo = this.oauthStateStore.getAndDelete(state);
    if (!returnTo) {
      this.logger.warn(
        `State inválido o expirado: ${state.substring(0, 8)}...`,
      );
      res.redirect('com.endure.app://?error=state_invalido');
      return;
    }

    try {
      this.logger.log(
        'Callback Google recibido, intercambiando code por perfil...',
      );
      const profile = await this.googleOAuthService.getProfileFromCode(code);
      this.logger.log(
        `Perfil Google obtenido: ${profile.email} (${profile.id})`,
      );

      const provider = 'google';

      let user = await this.userRepository.findBySocialId(provider, profile.id);

      if (user) {
        user.updateFromSocial(profile.email, profile.name, profile.picture);
        await this.userRepository.save(user);
        this.logger.log(`Usuario existente actualizado: ${user.id}`);
      } else {
        const existingByEmail = await this.userRepository.findByEmail(
          profile.email,
        );
        if (existingByEmail) {
          existingByEmail.authProvider = provider;
          existingByEmail.socialId = profile.id;
          existingByEmail.privacyAccepted = true;
          existingByEmail.emailVerified = true;
          if (profile.picture) existingByEmail.avatarUrl = profile.picture;
          await this.userRepository.save(existingByEmail);
          user = existingByEmail;
          this.logger.log(`Cuenta email vinculada a Google: ${user.id}`);
        } else {
          const base = profile.email
            .split('@')[0]
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .substring(0, 30);
          let username = base;
          let attempts = 0;
          while (
            attempts < 20 &&
            (await this.userRepository.existsByUsername(username))
          ) {
            attempts++;
            username = `${base.substring(0, 25)}_${Math.floor(Math.random() * 10000)}`;
          }
          if (attempts >= 20) username = `${base}_${Date.now()}`;

          user = User.createFromSocial(
            crypto.randomUUID(),
            profile.email,
            username,
            provider,
            profile.id,
            profile.picture,
          );
          await this.userRepository.save(user);
          this.logger.log(`Usuario nuevo creado desde Google: ${user.id}`);
        }
      }

      if (user.status === 'locked') {
        res.redirect(`${returnTo}?error=cuenta_bloqueada`);
        return;
      }

      const ttlSeconds = parseInt(
        this.configService.get<string>('MOBILE_OAUTH_CODE_TTL_SECONDS', '120'),
        10,
      );
      const tempCodeValue = generateTempCode();
      const tempCode = SocialAuthCode.create(
        user.id,
        provider,
        tempCodeValue,
        new Date(Date.now() + ttlSeconds * 1000),
      );

      await this.authCodeRepository.save(tempCode);
      this.logger.log(
        `Código temporal generado para usuario ${user.id}, TTL=${ttlSeconds}s`,
      );

      this.logger.log(`Redirigiendo a app con code temporal`);
      res.redirect(`${returnTo}?code=${tempCode.code}&provider=google`);
    } catch (err) {
      this.logger.error(`Error en callback Google: ${(err as Error).message}`);
      res.redirect(`${returnTo}?error=autenticacion_fallida`);
    }
  }

  @Public()
  @Post('social/exchange-code')
  @HttpCode(HttpStatus.OK)
  async exchangeSocialCode(
    @Body() dto: ExchangeSocialCodeDto,
  ): Promise<AuthResponseDto> {
    this.logger.log(`Intercambiando código temporal...`);
    const result = await this.socialExchangeCodeUseCase.execute(dto);

    const response = new AuthResponseDto();
    response.id = result.user.id;
    response.email = result.user.email;
    response.username = result.user.username;
    response.role = result.user.role;
    response.emailVerified = result.user.emailVerified;
    response.accessToken = result.accessToken;
    response.refreshToken = result.refreshToken;

    this.logger.log(
      `Código canjeado exitosamente para usuario ${result.user.id}`,
    );
    return response;
  }
}

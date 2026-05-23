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
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtPayload } from '../strategies/jwt.strategy';
import {
  CookieHelper,
  COOKIE_HELPER_PORT,
} from '../../../infrastructure/providers/cookie-helper.provider';
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
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { PasswordRecoveryDto } from '../dtos/password-recovery.dto';
import { PasswordResetDto } from '../dtos/password-reset.dto';
import { SocialLoginDto } from '../dtos/social-login.dto';
import { AuthResponseDto } from '../dtos/auth.response';

@Controller('auth')
export class AuthController {
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
    @Inject(COOKIE_HELPER_PORT)
    private readonly cookieHelper: CookieHelper,
  ) {}

  private isMobileClient(req: Request): boolean {
    return req.headers['x-client-type'] === 'mobile';
  }

  private buildAuthResponse(
    result: {
      user: { id: string; email: string; username: string; role: string; emailVerified: boolean };
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
}

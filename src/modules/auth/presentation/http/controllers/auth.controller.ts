import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { JwtPayload } from '../strategies/jwt.strategy';
import { CookieHelper, COOKIE_HELPER_PORT } from '../../../infrastructure/providers/cookie-helper.provider';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user/register-user.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user/login-user.use-case';
import { LogoutUserUseCase } from '../../../application/use-cases/logout-user/logout-user.use-case';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token/refresh-token.use-case';
import { CheckTokenUseCase } from '../../../application/use-cases/check-token/check-token.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { AuthResponseDto } from '../dtos/auth.response';
import { Inject } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUserUseCase,
    private readonly logoutUseCase: LogoutUserUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly checkTokenUseCase: CheckTokenUseCase,
    @Inject(COOKIE_HELPER_PORT)
    private readonly cookieHelper: CookieHelper,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.registerUseCase.execute(dto);
    this.cookieHelper.setAuthCookies(res, result.accessToken, result.refreshToken);
    const response = new AuthResponseDto();
    response.id = result.user.id;
    response.email = result.user.email;
    response.username = result.user.username;
    response.role = result.user.role;
    return response;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.loginUseCase.execute(dto);
    this.cookieHelper.setAuthCookies(res, result.accessToken, result.refreshToken);
    const response = new AuthResponseDto();
    response.id = result.user.id;
    response.email = result.user.email;
    response.username = result.user.username;
    response.role = result.user.role;
    return response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const refreshToken = req.cookies?.refresh_token;
    await this.logoutUseCase.execute(refreshToken);
    this.cookieHelper.clearAuthCookies(res);
    return { success: true };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean }> {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      this.cookieHelper.clearAuthCookies(res);
      return { success: false };
    }
    const result = await this.refreshUseCase.execute(refreshToken);
    this.cookieHelper.setAuthCookies(res, result.accessToken, result.refreshToken);
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
    return response;
  }
}

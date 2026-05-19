import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  AuthResponseDto,
  LoginRequestDto,
  PasswordRecoveryRequestDto,
  PasswordResetRequestDto,
  RegisterRequestDto,
} from './dev-auth.dto';
import { DevAuthService } from './dev-auth.service';

@Controller('auth')
export class DevAuthController {
  constructor(private readonly authService: DevAuthService) {}

  @Post('register')
  public register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  public login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('logout')
  public logout(): { message: string } {
    return { message: 'Logged out' };
  }

  @Get('me')
  public me(): Promise<AuthResponseDto> {
    return this.authService.me();
  }

  @Post('password-recovery')
  public passwordRecovery(@Body() _dto: PasswordRecoveryRequestDto): {
    message: string;
  } {
    return { message: 'Dev password recovery accepted' };
  }

  @Get('password-reset/validate')
  public validatePasswordResetToken(@Query('token') token?: string): {
    valid: boolean;
  } {
    return { valid: Boolean(token) };
  }

  @Post('password-reset')
  public passwordReset(@Body() _dto: PasswordResetRequestDto): {
    message: string;
  } {
    return { message: 'Dev password reset accepted' };
  }
}

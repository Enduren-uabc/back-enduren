import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class PasswordRecoveryRequestDto {
  @IsEmail()
  email!: string;
}

export class PasswordResetRequestDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export interface AuthResponseDto {
  userId: string;
  role: string;
  email: string;
  username: string;
  onboardingCompleted?: boolean;
}

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Length,
} from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class LoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class PasswordRecoveryRequestDto {
  @IsEmail()
  email!: string;
}

export class PasswordResetRequestDto {
  @IsString()
  @Length(6, 6)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export interface AuthResponseDto {
  userId: string;
  role: string;
  email: string;
  username: string;
  onboardingCompleted?: boolean;
}

import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username must contain only letters, numbers and underscores',
  })
  username!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  password!: string;

  @IsOptional()
  @IsIn(['trainer', 'user'])
  role?: 'trainer' | 'user';
}

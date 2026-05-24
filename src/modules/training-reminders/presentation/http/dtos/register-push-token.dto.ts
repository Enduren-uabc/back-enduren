import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class RegisterPushTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsIn(['ios', 'android'])
  platform!: 'ios' | 'android';
}

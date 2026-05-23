import { IsString, IsBoolean, IsIn } from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsIn(['google', 'apple'])
  provider!: 'google' | 'apple';

  @IsString()
  idToken!: string;

  @IsBoolean()
  privacyAccepted!: boolean;
}

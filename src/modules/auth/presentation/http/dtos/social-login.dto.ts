import { IsString, IsBoolean, IsIn, Length } from 'class-validator';

export class SocialLoginDto {
  @IsString()
  @IsIn(['google', 'apple'])
  provider!: 'google' | 'apple';

  @IsString()
  @Length(1, 5000)
  idToken!: string;

  @IsBoolean()
  privacyAccepted!: boolean;
}

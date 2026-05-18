import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { MAX_PROFILE_BIO_LENGTH } from '../../../domain/entities/social-profile.entity';

export class UpdateOwnProfileRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(MAX_PROFILE_BIO_LENGTH)
  bio?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatarUrl?: string | null;
}

import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MAX_PROFILE_BIO_LENGTH } from '../../../domain/entities/social-profile.entity';

const MAX_AVATAR_URL_LENGTH = 2048;
const HANDLE_REGEX = /^[a-z0-9._]+$/;

export class UpdateOwnProfileRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_PROFILE_BIO_LENGTH)
  bio?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(MAX_AVATAR_URL_LENGTH)
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(HANDLE_REGEX, {
    message:
      'El handle solo puede contener letras minúsculas, números, puntos y guiones bajos',
  })
  handle?: string | null;
}

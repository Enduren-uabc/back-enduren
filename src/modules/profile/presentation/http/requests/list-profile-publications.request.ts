import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_PROFILE_PUBLICATIONS_LIMIT } from '../../../application/use-cases/list-profile-publications/list-profile-publications.use-case';

export class ListProfilePublicationsRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PROFILE_PUBLICATIONS_LIMIT)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

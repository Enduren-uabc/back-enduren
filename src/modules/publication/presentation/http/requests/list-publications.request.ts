import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_PUBLICATION_FEED_LIMIT } from '../../../application/use-cases/list-publications/list-publications.use-case';

export class ListPublicationsRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PUBLICATION_FEED_LIMIT)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsIn(['all', 'following'])
  filter?: 'all' | 'following';
}

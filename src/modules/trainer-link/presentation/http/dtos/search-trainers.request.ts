import { IsOptional, IsString, MinLength } from 'class-validator';

export class SearchTrainersRequestDto {
  @IsString()
  @MinLength(2)
  q!: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

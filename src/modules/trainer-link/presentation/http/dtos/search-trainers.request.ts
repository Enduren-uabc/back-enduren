import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class SearchTrainersRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  q!: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchProfilesRequestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  q!: string;
}

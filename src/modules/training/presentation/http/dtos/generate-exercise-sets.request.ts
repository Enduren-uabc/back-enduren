import {
  IsInt,
  Min,
  Max,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class GenerateExerciseSetsRequestDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  strategyKey!: string | null;

  @IsInt()
  @Min(1)
  @Max(10)
  numberOfSets!: number;

  @IsNumber()
  @Min(0)
  initialWeight!: number;

  @IsInt()
  @Min(1)
  @Max(50)
  initialReps!: number;
}

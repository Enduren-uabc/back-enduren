import {
  IsInt,
  Min,
  Max,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GenerateExerciseSetsRequestDto {
  @IsOptional()
  @IsString()
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

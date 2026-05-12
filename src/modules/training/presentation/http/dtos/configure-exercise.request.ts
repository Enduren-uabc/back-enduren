import {
  IsInt,
  Min,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExerciseSetDto {
  @IsInt()
  @Min(1)
  setNumber!: number;

  @IsInt()
  @Min(1)
  reps!: number;

  @Min(0)
  weight!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;
}

export class ConfigureExerciseRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseSetDto)
  sets!: ExerciseSetDto[];
}

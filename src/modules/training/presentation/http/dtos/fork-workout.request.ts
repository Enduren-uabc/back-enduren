import {
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ForkExerciseOverrideDto {
  @IsString()
  @IsUUID()
  sourceExerciseId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  repsPerSet?: number;

  @IsOptional()
  @Min(0)
  weight?: number;
}

export class ForkWorkoutRequestDto {
  @IsString()
  @IsUUID()
  sourceWorkoutSessionId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ForkExerciseOverrideDto)
  exercises?: ForkExerciseOverrideDto[];
}

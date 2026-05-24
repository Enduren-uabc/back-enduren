import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

class ExerciseInputDto {
  @IsUUID()
  exerciseId: string;

  @IsString()
  name: string;

  @Min(1)
  sets: number;

  @Min(1)
  reps: number;

  @Min(0)
  restSeconds: number;

  @Min(1)
  order: number;
}

class DayInputDto {
  @IsString()
  dayOfWeek: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseInputDto)
  exercises: ExerciseInputDto[];
}

export class EditAssignedRoutineContentRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DayInputDto)
  days?: DayInputDto[];
}

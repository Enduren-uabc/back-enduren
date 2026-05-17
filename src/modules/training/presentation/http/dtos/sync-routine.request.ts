import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncRoutineExerciseSetDto {
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

export class SyncRoutineExerciseDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  order!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRoutineExerciseSetDto)
  sets?: SyncRoutineExerciseSetDto[];
}

export class SyncRoutineDayDto {
  @IsString()
  dayOfWeek!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRoutineExerciseDto)
  exercises!: SyncRoutineExerciseDto[];
}

export class SyncRoutineRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRoutineDayDto)
  days!: SyncRoutineDayDto[];
}

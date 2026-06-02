import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  Length,
  Matches,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VALID_DAYS } from './create-routine.request';

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
  @Length(1, 100)
  @Matches(/[a-zA-Z]/, {
    message: 'El nombre debe contener al menos una letra',
  })
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
  @IsIn(VALID_DAYS)
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

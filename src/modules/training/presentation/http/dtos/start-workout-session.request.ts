import { IsIn, IsUUID } from 'class-validator';
import type { DayOfWeek } from '../../../domain/value-objects/routine-day.value-object';

const VALID_DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export class StartWorkoutSessionRequestDto {
  @IsUUID()
  routineId!: string;

  @IsIn(VALID_DAYS_OF_WEEK)
  dayOfWeek!: DayOfWeek;
}

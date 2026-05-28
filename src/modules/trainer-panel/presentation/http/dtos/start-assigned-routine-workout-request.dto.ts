import { IsIn, IsOptional } from 'class-validator';

const VALID_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export class StartAssignedRoutineWorkoutRequestDto {
  @IsOptional()
  @IsIn(VALID_DAYS)
  dayOfWeek?: string;
}

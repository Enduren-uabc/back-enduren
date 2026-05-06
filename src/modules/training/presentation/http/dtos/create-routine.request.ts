import { IsString, IsArray, ArrayMinSize, IsIn } from 'class-validator';

const VALID_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export class CreateRoutineRequestDto {
  @IsString()
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(VALID_DAYS, { each: true })
  dayOfWeeks!: string[];
}

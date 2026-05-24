import { IsString, IsArray, ArrayMinSize, IsIn, Length } from 'class-validator';

export const VALID_DAYS = [
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
  @Length(1, 50)
  name!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(VALID_DAYS, { each: true })
  dayOfWeeks!: string[];
}

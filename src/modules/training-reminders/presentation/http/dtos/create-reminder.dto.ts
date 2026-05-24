import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateReminderRequestDto {
  @IsString()
  @IsNotEmpty()
  routineId!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)
  dayOfWeek!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/)
  time!: string;

  @IsString()
  timezone?: string;
}

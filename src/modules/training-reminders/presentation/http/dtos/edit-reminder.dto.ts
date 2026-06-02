import { IsString, IsOptional, Matches } from 'class-validator';

export class EditReminderRequestDto {
  @IsOptional()
  @IsString()
  @Matches(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)
  dayOfWeek?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  time?: string;
}

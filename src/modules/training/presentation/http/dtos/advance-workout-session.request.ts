import { IsBoolean, IsOptional } from 'class-validator';

export class AdvanceWorkoutSessionRequestDto {
  @IsOptional()
  @IsBoolean()
  allowIncomplete?: boolean;
}

import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReplaceRoutineRequestDto {
  @IsUUID()
  newRoutineId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

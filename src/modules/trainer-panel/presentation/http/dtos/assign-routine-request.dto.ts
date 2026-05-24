import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignRoutineRequestDto {
  @IsUUID()
  routineId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

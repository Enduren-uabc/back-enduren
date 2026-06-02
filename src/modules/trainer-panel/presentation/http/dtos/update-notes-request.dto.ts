import { IsString, MaxLength } from 'class-validator';

export class UpdateNotesRequestDto {
  @IsString()
  @MaxLength(500)
  notes: string;
}

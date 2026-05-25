import { IsString, Length } from 'class-validator';

export class UpdateRoutineNameRequestDto {
  @IsString()
  @Length(1, 50)
  name!: string;
}

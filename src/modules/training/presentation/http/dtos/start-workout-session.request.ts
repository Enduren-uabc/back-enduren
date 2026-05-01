import { IsUUID } from 'class-validator';

export class StartWorkoutSessionRequestDto {
  @IsUUID()
  routineId!: string;
}

import { IsInt, Min } from 'class-validator';

export class AddWorkoutSetRequestDto {
  @IsInt()
  @Min(1)
  reps!: number;

  @Min(0)
  weight!: number;
}

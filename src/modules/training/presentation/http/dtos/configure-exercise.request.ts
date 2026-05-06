import { IsInt, Min, Max } from 'class-validator';

export class ConfigureExerciseRequestDto {
  @IsInt()
  @Min(1)
  @Max(10)
  sets!: number;

  @IsInt()
  @Min(1)
  @Max(50)
  repsPerSet!: number;

  @Min(0)
  weight!: number;
}

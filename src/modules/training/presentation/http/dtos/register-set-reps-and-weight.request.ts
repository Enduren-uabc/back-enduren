import { IsInt, Min } from 'class-validator';

/**
 * Request DTO for registering reps and weight for a workout set.
 * RF-12.0.2: Register reps/weight per set during workout session.
 */
export class RegisterSetRepsAndWeightRequestDto {
  @IsInt()
  @Min(1)
  repsPerformed!: number;

  @IsInt()
  @Min(0)
  weightUsed!: number;
}

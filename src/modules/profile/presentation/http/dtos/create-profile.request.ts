import {
  IsString,
  IsDateString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  Length,
} from 'class-validator';

export class CreateProfileRequestDto {
  @IsString()
  @Length(2, 100)
  fullName!: string;

  @IsDateString()
  birthDate!: string;

  @IsIn(['male', 'female', 'other'])
  gender!: 'male' | 'female' | 'other';

  @IsNumber()
  @IsPositive()
  weight!: number;

  @IsNumber()
  @IsPositive()
  height!: number;

  @IsIn(['beginner', 'intermediate', 'advanced'])
  experienceLevel!: 'beginner' | 'intermediate' | 'advanced';

  @IsIn([
    'lose_weight',
    'gain_muscle',
    'maintain',
    'improve_endurance',
    'general_fitness',
  ])
  mainGoal!:
    | 'lose_weight'
    | 'gain_muscle'
    | 'maintain'
    | 'improve_endurance'
    | 'general_fitness';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  daysAvailablePerWeek?: number;

  @IsOptional()
  @IsIn(['kg', 'lbs'])
  weightUnit?: 'kg' | 'lbs';
}

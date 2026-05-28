import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateDefaultRoutineRequestDto {
  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  experienceLevel!: string;

  @IsOptional()
  @IsString()
  @IsIn(['ppl', 'arnold'])
  trainingSplitKey?: string;

  @IsString()
  trainingStrategyKey!: string;
}

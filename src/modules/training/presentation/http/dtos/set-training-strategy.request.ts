import { IsOptional, IsString, Length } from 'class-validator';

export class SetTrainingStrategyRequestDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  strategyKey!: string | null;
}

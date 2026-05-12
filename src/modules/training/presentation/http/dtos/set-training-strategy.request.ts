import { IsOptional, IsString } from 'class-validator';

export class SetTrainingStrategyRequestDto {
  @IsOptional()
  @IsString()
  strategyKey!: string | null;
}

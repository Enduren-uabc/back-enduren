import { Controller, Get, Inject, UseGuards, UseFilters } from '@nestjs/common';
import {
  ListTrainingStrategiesUseCase,
  TRAINING_STRATEGY_REPOSITORY_PORT,
} from '../../../application/use-cases/list-training-strategies/list-training-strategies.use-case';
import { TrainingStrategyRepository } from '../../../domain/repositories/training-strategy.repository';
import { TrainingStrategyResponseDto } from '../dtos/training-strategy.response';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { TrainingStrategyDomainErrorFilter } from '../filters/training-strategy-domain-error.filter';

@Controller('training-strategies')
@UseGuards(JwtAuthGuard)
@UseFilters(TrainingStrategyDomainErrorFilter)
export class TrainingStrategyController {
  private readonly listTrainingStrategiesUseCase: ListTrainingStrategiesUseCase;

  constructor(
    @Inject(TRAINING_STRATEGY_REPOSITORY_PORT)
    trainingStrategyRepository: TrainingStrategyRepository,
  ) {
    this.listTrainingStrategiesUseCase = new ListTrainingStrategiesUseCase(
      trainingStrategyRepository,
    );
  }

  @Get()
  public async list(): Promise<{ strategies: TrainingStrategyResponseDto[] }> {
    const result = await this.listTrainingStrategiesUseCase.execute();

    return {
      strategies: result.strategies.map((s) => {
        const dto = new TrainingStrategyResponseDto();
        dto.key = s.key;
        dto.name = s.name;
        dto.description = s.description;
        dto.rules = s.rules;
        return dto;
      }),
    };
  }
}

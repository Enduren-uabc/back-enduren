import { Controller, Get, UseGuards, UseFilters } from '@nestjs/common';
import { ListTrainingStrategiesUseCase } from '../../../application/use-cases/list-training-strategies/list-training-strategies.use-case';
import { TrainingStrategyResponseDto } from '../dtos/training-strategy.response';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { TrainingStrategyDomainErrorFilter } from '../filters/training-strategy-domain-error.filter';

@Controller('training-strategies')
@UseGuards(JwtAuthGuard)
@UseFilters(TrainingStrategyDomainErrorFilter)
export class TrainingStrategyController {
  constructor(
    private readonly listTrainingStrategiesUseCase: ListTrainingStrategiesUseCase,
  ) {}

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

import { TrainingStrategyRepository } from '../../../domain/repositories/training-strategy.repository';

export const TRAINING_STRATEGY_REPOSITORY_PORT = Symbol(
  'TRAINING_STRATEGY_REPOSITORY_PORT',
);

export interface ListTrainingStrategiesOutput {
  strategies: Array<{
    key: string;
    name: string;
    description: string;
    rules: Record<string, unknown>;
  }>;
}

export class ListTrainingStrategiesUseCase {
  constructor(
    private readonly trainingStrategyRepository: TrainingStrategyRepository,
  ) {}

  public async execute(): Promise<ListTrainingStrategiesOutput> {
    const strategies = await this.trainingStrategyRepository.findAll();

    return {
      strategies: strategies.map((s) => ({
        key: s.key,
        name: s.name,
        description: s.description,
        rules: s.rules.toJson() as unknown as Record<string, unknown>,
      })),
    };
  }
}

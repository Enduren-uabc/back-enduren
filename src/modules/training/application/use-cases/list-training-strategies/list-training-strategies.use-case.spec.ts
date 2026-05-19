import { ListTrainingStrategiesUseCase } from './list-training-strategies.use-case';
import { TrainingStrategyRepository } from '../../../domain/repositories/training-strategy.repository';
import { TrainingStrategy } from '../../../domain/entities/training-strategy.entity';

describe('ListTrainingStrategiesUseCase', () => {
  let useCase: ListTrainingStrategiesUseCase;
  let repository: TrainingStrategyRepository;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findByKey: jest.fn(),
    };
    useCase = new ListTrainingStrategiesUseCase(repository);
  });

  it('should return all strategies with rules serialized', async () => {
    const strategies = TrainingStrategy.seedStrategies();
    (repository.findAll as jest.Mock).mockResolvedValue(strategies);

    const result = await useCase.execute();

    expect(result.strategies).toHaveLength(5);
    expect(result.strategies[0].key).toBe('straight');
    expect(result.strategies[0].rules).toEqual({
      type: 'linear',
      weightStep: 0,
      repStep: 0,
    });
    expect(result.strategies[4].key).toBe('wave_loading');
    expect(result.strategies[4].rules).toEqual({
      type: 'wave',
      wavePercentages: [0, 0.05, 0.025, 0.075],
    });
  });

  it('should return empty array when no strategies exist', async () => {
    (repository.findAll as jest.Mock).mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.strategies).toHaveLength(0);
  });
});

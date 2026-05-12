import { GenerateExerciseSetsUseCase } from './generate-exercise-sets.use-case';
import { TrainingStrategyRepository } from '../../../domain/repositories/training-strategy.repository';
import { TrainingStrategy } from '../../../domain/entities/training-strategy.entity';
import {
  TrainingStrategyDomainError,
  TrainingStrategyErrorCode,
} from '../../../domain/errors/training-strategy-domain.error';

describe('GenerateExerciseSetsUseCase', () => {
  let useCase: GenerateExerciseSetsUseCase;
  let trainingStrategyRepository: TrainingStrategyRepository;

  beforeEach(() => {
    trainingStrategyRepository = {
      findAll: jest.fn(),
      findByKey: jest.fn(),
    };
    useCase = new GenerateExerciseSetsUseCase(trainingStrategyRepository);
  });

  it('should return flat sets when strategyKey is null', async () => {
    const result = await useCase.execute({
      strategyKey: null,
      numberOfSets: 3,
      initialWeight: 40,
      initialReps: 8,
    });

    expect(result.sets).toEqual([
      { setNumber: 1, reps: 8, weight: 40 },
      { setNumber: 2, reps: 8, weight: 40 },
      { setNumber: 3, reps: 8, weight: 40 },
    ]);
  });

  it('should generate ascending sets', async () => {
    const strategy = TrainingStrategy.seedStrategies()[1]; // ascending
    (trainingStrategyRepository.findByKey as jest.Mock).mockResolvedValue(
      strategy,
    );

    const result = await useCase.execute({
      strategyKey: 'ascending',
      numberOfSets: 4,
      initialWeight: 30,
      initialReps: 10,
    });

    expect(result.sets).toEqual([
      { setNumber: 1, reps: 10, weight: 30 },
      { setNumber: 2, reps: 8, weight: 32.5 },
      { setNumber: 3, reps: 6, weight: 35 },
      { setNumber: 4, reps: 4, weight: 37.5 },
    ]);
  });

  it('should generate drop sets', async () => {
    const strategy = TrainingStrategy.seedStrategies()[3]; // drop_sets
    (trainingStrategyRepository.findByKey as jest.Mock).mockResolvedValue(
      strategy,
    );

    const result = await useCase.execute({
      strategyKey: 'drop_sets',
      numberOfSets: 3,
      initialWeight: 30,
      initialReps: 10,
    });

    expect(result.sets).toEqual([
      { setNumber: 1, reps: 10, weight: 30 },
      { setNumber: 2, reps: 10, weight: 24 },
      { setNumber: 3, reps: 10, weight: 19.2 },
    ]);
  });

  it('should reject invalid numberOfSets', async () => {
    await expect(
      useCase.execute({
        strategyKey: null,
        numberOfSets: 0,
        initialWeight: 30,
        initialReps: 10,
      }),
    ).rejects.toThrow(TrainingStrategyDomainError);

    try {
      await useCase.execute({
        strategyKey: null,
        numberOfSets: 0,
        initialWeight: 30,
        initialReps: 10,
      });
    } catch (error) {
      expect((error as TrainingStrategyDomainError).code).toBe(
        TrainingStrategyErrorCode.EXERCISE_SETS_OUT_OF_RANGE,
      );
    }
  });

  it('should reject invalid initialReps', async () => {
    await expect(
      useCase.execute({
        strategyKey: null,
        numberOfSets: 3,
        initialWeight: 30,
        initialReps: 51,
      }),
    ).rejects.toThrow(TrainingStrategyDomainError);
  });

  it('should reject negative initialWeight', async () => {
    await expect(
      useCase.execute({
        strategyKey: null,
        numberOfSets: 3,
        initialWeight: -1,
        initialReps: 10,
      }),
    ).rejects.toThrow(TrainingStrategyDomainError);
  });

  it('should reject unknown strategy key', async () => {
    (trainingStrategyRepository.findByKey as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({
        strategyKey: 'unknown',
        numberOfSets: 3,
        initialWeight: 30,
        initialReps: 10,
      }),
    ).rejects.toThrow(TrainingStrategyDomainError);
  });
});

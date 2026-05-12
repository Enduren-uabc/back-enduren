import { TrainingStrategyRepository } from '../../../domain/repositories/training-strategy.repository';
import {
  TrainingStrategyDomainError,
  TrainingStrategyErrorCode,
} from '../../../domain/errors/training-strategy-domain.error';

export const TRAINING_STRATEGY_REPOSITORY_PORT_FOR_GENERATE = Symbol(
  'TRAINING_STRATEGY_REPOSITORY_PORT_FOR_GENERATE',
);

export interface GenerateExerciseSetsInput {
  strategyKey: string | null;
  numberOfSets: number;
  initialWeight: number;
  initialReps: number;
}

export interface GenerateExerciseSetsOutput {
  sets: Array<{
    setNumber: number;
    reps: number;
    weight: number;
  }>;
}

export class GenerateExerciseSetsUseCase {
  constructor(
    private readonly trainingStrategyRepository: TrainingStrategyRepository,
  ) {}

  public async execute(
    input: GenerateExerciseSetsInput,
  ): Promise<GenerateExerciseSetsOutput> {
    if (
      !Number.isInteger(input.numberOfSets) ||
      input.numberOfSets < 1 ||
      input.numberOfSets > 10
    ) {
      throw new TrainingStrategyDomainError(
        TrainingStrategyErrorCode.EXERCISE_SETS_OUT_OF_RANGE,
        'Number of sets must be an integer between 1 and 10',
        { numberOfSets: input.numberOfSets },
      );
    }

    if (
      !Number.isInteger(input.initialReps) ||
      input.initialReps < 1 ||
      input.initialReps > 50
    ) {
      throw new TrainingStrategyDomainError(
        TrainingStrategyErrorCode.EXERCISE_REPS_OUT_OF_RANGE,
        'Initial reps must be an integer between 1 and 50',
        { initialReps: input.initialReps },
      );
    }

    if (typeof input.initialWeight !== 'number' || input.initialWeight < 0) {
      throw new TrainingStrategyDomainError(
        TrainingStrategyErrorCode.EXERCISE_WEIGHT_INVALID,
        'Initial weight must be a number >= 0',
        { initialWeight: input.initialWeight },
      );
    }

    // If no strategy, return flat sets
    if (input.strategyKey === null) {
      return {
        sets: Array.from({ length: input.numberOfSets }, (_, i) => ({
          setNumber: i + 1,
          reps: input.initialReps,
          weight: input.initialWeight,
        })),
      };
    }

    const strategy = await this.trainingStrategyRepository.findByKey(
      input.strategyKey,
    );

    if (!strategy) {
      throw new TrainingStrategyDomainError(
        TrainingStrategyErrorCode.STRATEGY_NOT_FOUND,
        `Training strategy with key "${input.strategyKey}" not found`,
        { strategyKey: input.strategyKey },
      );
    }

    const sets = strategy.generateSets(
      input.numberOfSets,
      input.initialWeight,
      input.initialReps,
    );

    return { sets };
  }
}

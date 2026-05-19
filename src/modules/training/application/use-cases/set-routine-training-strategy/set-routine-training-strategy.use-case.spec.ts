import { SetRoutineTrainingStrategyUseCase } from './set-routine-training-strategy.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { TrainingStrategyRepository } from '../../../domain/repositories/training-strategy.repository';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import {
  TrainingStrategyDomainError,
  TrainingStrategyErrorCode,
} from '../../../domain/errors/training-strategy-domain.error';
import { TrainingStrategy } from '../../../domain/entities/training-strategy.entity';

describe('SetRoutineTrainingStrategyUseCase', () => {
  let useCase: SetRoutineTrainingStrategyUseCase;
  let routineRepository: RoutineRepository;
  let trainingStrategyRepository: TrainingStrategyRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  beforeEach(() => {
    routineRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      existsByNameForUser: jest.fn(),
      countByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      delete: jest.fn(),
    };
    trainingStrategyRepository = {
      findAll: jest.fn(),
      findByKey: jest.fn(),
    };
    useCase = new SetRoutineTrainingStrategyUseCase(
      routineRepository,
      trainingStrategyRepository,
    );
  });

  function makeRoutine(
    userId: string,
    trainingStrategyKey: string | null = null,
  ): Routine {
    return Routine.create(
      'routine-1',
      'Test Routine',
      userId,
      [RoutineDay.create('monday')],
      false,
      trainingStrategyKey,
    );
  }

  it('should set a training strategy on a routine', async () => {
    const routine = makeRoutine('user-1');
    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(
      routine,
    );
    (trainingStrategyRepository.findByKey as jest.Mock).mockResolvedValue(
      TrainingStrategy.seedStrategies()[1],
    );
    (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
      Promise.resolve(r),
    );

    const result = await useCase.execute(actor, {
      routineId: 'routine-1',
      strategyKey: 'ascending',
    });

    expect(result.trainingStrategyKey).toBe('ascending');
    expect(routineRepository.save as jest.Mock).toHaveBeenCalled();
  });

  it('should clear a training strategy when strategyKey is null', async () => {
    const routine = makeRoutine('user-1', 'straight');
    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(
      routine,
    );
    (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
      Promise.resolve(r),
    );

    const result = await useCase.execute(actor, {
      routineId: 'routine-1',
      strategyKey: null,
    });

    expect(result.trainingStrategyKey).toBeNull();
  });

  it('should reject when routine not found', async () => {
    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, {
        routineId: 'missing',
        strategyKey: 'straight',
      }),
    ).rejects.toThrow(RoutineDomainError);

    try {
      await useCase.execute(actor, {
        routineId: 'missing',
        strategyKey: 'straight',
      });
    } catch (error) {
      expect((error as RoutineDomainError).code).toBe(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
      );
    }
  });

  it('should reject when strategy key is unknown', async () => {
    const routine = makeRoutine('user-1');
    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(
      routine,
    );
    (trainingStrategyRepository.findByKey as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, {
        routineId: 'routine-1',
        strategyKey: 'unknown',
      }),
    ).rejects.toThrow(TrainingStrategyDomainError);

    try {
      await useCase.execute(actor, {
        routineId: 'routine-1',
        strategyKey: 'unknown',
      });
    } catch (error) {
      expect((error as TrainingStrategyDomainError).code).toBe(
        TrainingStrategyErrorCode.STRATEGY_NOT_FOUND,
      );
    }
  });
});

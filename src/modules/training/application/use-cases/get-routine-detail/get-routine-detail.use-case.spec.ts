import { GetRoutineDetailUseCase } from './get-routine-detail.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../../domain/entities/exercise.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

describe('GetRoutineDetailUseCase', () => {
  let useCase: GetRoutineDetailUseCase;
  let routineRepository: RoutineRepository;
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
    useCase = new GetRoutineDetailUseCase(routineRepository);
  });

  it('should return routine detail for a routine owned by the current user', async () => {
    const day = RoutineDay.create('monday');
    const exercise = Exercise.create('ex-1', 'Push-ups', 0);
    const dayWithEx = day.addExercise(exercise);
    const dayWithConfig = dayWithEx.configureExercise('ex-1', 3, 12, 50);
    const routine = Routine.reconstitute(
      'r-1',
      'My Routine',
      'user-1',
      [dayWithConfig],
      true,
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );

    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(
      routine,
    );

    const result = await useCase.execute(actor, { routineId: 'r-1' });

    expect(result.id).toBe('r-1');
    expect(result.name).toBe('My Routine');
    expect(result.userId).toBe('user-1');
    expect(result.isActive).toBe(true);
    expect(result.days).toHaveLength(1);
    expect(result.days[0].dayOfWeek).toBe('monday');
    expect(result.days[0].exercises).toHaveLength(1);
    expect(result.days[0].exercises[0].sets).toBe(3);
    expect(result.days[0].exercises[0].repsPerSet).toBe(12);
    expect(result.days[0].exercises[0].weight).toBe(50);
    expect(
      routineRepository.findByIdAndUserId as jest.Mock,
    ).toHaveBeenCalledWith('r-1', 'user-1');
  });

  it('should throw ROUTINE_NOT_FOUND when routine does not exist or belongs to another user', async () => {
    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { routineId: 'nonexistent' }),
    ).rejects.toThrow(RoutineDomainError);

    try {
      await useCase.execute(actor, { routineId: 'nonexistent' });
    } catch (error) {
      expect(error).toBeInstanceOf(RoutineDomainError);
      expect((error as RoutineDomainError).code).toBe(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
      );
    }
  });

  it('should return routine detail with inactive status', async () => {
    const routine = Routine.reconstitute(
      'r-2',
      'Inactive Routine',
      'user-1',
      [RoutineDay.create('friday')],
      false,
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );

    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(
      routine,
    );

    const result = await useCase.execute(actor, { routineId: 'r-2' });

    expect(result.isActive).toBe(false);
  });
});

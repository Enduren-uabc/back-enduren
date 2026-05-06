import { DeleteRoutineUseCase } from './delete-routine.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

describe('DeleteRoutineUseCase', () => {
  let useCase: DeleteRoutineUseCase;
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
    useCase = new DeleteRoutineUseCase(routineRepository);
  });

  it('should delete an inactive routine owned by the current user', async () => {
    const routine = Routine.reconstitute(
      'r-1',
      'Inactive Routine',
      'user-1',
      [RoutineDay.create('monday')],
      false,
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );

    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(
      routine,
    );
    (routineRepository.delete as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute(actor, { routineId: 'r-1' });

    expect(result.id).toBe('r-1');
    expect(result.deleted).toBe(true);
    expect(routineRepository.delete as jest.Mock).toHaveBeenCalledWith(routine);
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

  it('should throw ROUTINE_IS_ACTIVE when trying to delete an active routine', async () => {
    const routine = Routine.reconstitute(
      'r-1',
      'Active Routine',
      'user-1',
      [RoutineDay.create('monday')],
      true,
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );

    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(
      routine,
    );

    await expect(useCase.execute(actor, { routineId: 'r-1' })).rejects.toThrow(
      RoutineDomainError,
    );

    try {
      await useCase.execute(actor, { routineId: 'r-1' });
    } catch (error) {
      expect(error).toBeInstanceOf(RoutineDomainError);
      expect((error as RoutineDomainError).code).toBe(
        RoutineErrorCode.ROUTINE_IS_ACTIVE,
      );
    }

    // Verify delete was never called
    expect(routineRepository.delete as jest.Mock).not.toHaveBeenCalled();
  });

  it('should not delete a routine belonging to another user', async () => {
    // findByIdAndUserId returns null for routines not owned by the user
    (routineRepository.findByIdAndUserId as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute(actor, { routineId: 'other-user-routine' }),
    ).rejects.toThrow(RoutineDomainError);

    expect(routineRepository.delete as jest.Mock).not.toHaveBeenCalled();
  });
});

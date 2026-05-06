import { DeactivateRoutineUseCase } from './deactivate-routine.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

describe('DeactivateRoutineUseCase', () => {
  let useCase: DeactivateRoutineUseCase;
  let routineRepository: RoutineRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const createRoutine = (
    overrides: Partial<{
      id: string;
      name: string;
      userId: string;
      isActive: boolean;
    }> = {},
  ): Routine => {
    const days = [RoutineDay.create('monday')];
    return Routine.reconstitute(
      overrides.id ?? 'routine-1',
      overrides.name ?? 'Test Routine',
      overrides.userId ?? 'user-1',
      days,
      overrides.isActive ?? true,
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );
  };

  beforeEach(() => {
    routineRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      existsByNameForUser: jest.fn(),
      countByUserId: jest.fn(),
      findActiveByUserId: jest.fn(),
    };
    useCase = new DeactivateRoutineUseCase(routineRepository);
  });

  describe('happy path: deactivate active routine', () => {
    it('should deactivate an active routine', async () => {
      const activeRoutine = createRoutine({
        id: 'routine-1',
        isActive: true,
      });

      const savedRoutines: Routine[] = [];

      (routineRepository.findById as jest.Mock).mockResolvedValue(
        activeRoutine,
      );
      (routineRepository.save as jest.Mock).mockImplementation(
        (routine: Routine) => {
          savedRoutines.push(routine);
          return Promise.resolve(routine);
        },
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
      });

      expect(result.isActive).toBe(false);
      expect(result.id).toBe('routine-1');

      expect(savedRoutines).toHaveLength(1);
      expect(savedRoutines[0].isActive).toBe(false);
    });
  });

  describe('idempotent: already inactive routine', () => {
    it('should return the routine unchanged if it is already inactive', async () => {
      const inactiveRoutine = createRoutine({
        id: 'routine-1',
        isActive: false,
      });

      (routineRepository.findById as jest.Mock).mockResolvedValue(
        inactiveRoutine,
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
      });

      expect(result.isActive).toBe(false);
      expect(result.id).toBe('routine-1');
      expect((routineRepository.save as jest.Mock).mock.calls.length).toBe(0);
    });
  });

  describe('routine not found', () => {
    it('should throw ROUTINE_NOT_FOUND when routine does not exist', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(null);

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
  });

  describe('routine not owned', () => {
    it('should throw ROUTINE_NOT_OWNED when routine belongs to another user', async () => {
      const otherUserRoutine = createRoutine({
        id: 'routine-1',
        userId: 'user-2',
        isActive: true,
      });

      (routineRepository.findById as jest.Mock).mockResolvedValue(
        otherUserRoutine,
      );

      await expect(
        useCase.execute(actor, { routineId: 'routine-1' }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, { routineId: 'routine-1' });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.ROUTINE_NOT_OWNED,
        );
      }
    });
  });
});

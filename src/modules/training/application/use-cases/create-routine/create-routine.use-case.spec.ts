import {
  CreateRoutineUseCase,
  MAX_ROUTINES_PER_USER,
} from './create-routine.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

describe('CreateRoutineUseCase', () => {
  let useCase: CreateRoutineUseCase;
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
    };
    useCase = new CreateRoutineUseCase(routineRepository);
  });

  describe('RF-09.0.2: Validate required fields', () => {
    it('should reject an empty name', async () => {
      await expect(
        useCase.execute(actor, { name: '', dayOfWeeks: ['monday'] }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, { name: '', dayOfWeeks: ['monday'] });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.ROUTINE_NAME_REQUIRED,
        );
      }
    });

    it('should reject a whitespace-only name', async () => {
      await expect(
        useCase.execute(actor, { name: '   ', dayOfWeeks: ['monday'] }),
      ).rejects.toThrow(RoutineDomainError);
    });

    it('should reject empty dayOfWeeks', async () => {
      await expect(
        useCase.execute(actor, { name: 'My Routine', dayOfWeeks: [] }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, { name: 'My Routine', dayOfWeeks: [] });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.ROUTINE_DAYS_MINIMUM,
        );
      }
    });
  });

  describe('RF-09.0.1: Validate name uniqueness', () => {
    it('should reject a duplicate routine name for the same user', async () => {
      (routineRepository.existsByNameForUser as jest.Mock).mockResolvedValue(
        true,
      );

      await expect(
        useCase.execute(actor, { name: 'My Routine', dayOfWeeks: ['monday'] }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          name: 'My Routine',
          dayOfWeeks: ['monday'],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.ROUTINE_DUPLICATE_NAME,
        );
      }
    });

    it('should allow the same name for different users', async () => {
      (routineRepository.existsByNameForUser as jest.Mock).mockResolvedValue(
        false,
      );
      (routineRepository.countByUserId as jest.Mock).mockResolvedValue(0);
      (routineRepository.save as jest.Mock).mockImplementation(
        (routine: Routine) => Promise.resolve(routine),
      );

      const result = await useCase.execute(actor, {
        name: 'My Routine',
        dayOfWeeks: ['monday'],
      });
      expect(result.name).toBe('My Routine');
    });
  });

  describe('RF-09.0.4: Validate routine count limit', () => {
    it('should reject when user already has 5 routines', async () => {
      (routineRepository.existsByNameForUser as jest.Mock).mockResolvedValue(
        false,
      );
      (routineRepository.countByUserId as jest.Mock).mockResolvedValue(
        MAX_ROUTINES_PER_USER,
      );

      await expect(
        useCase.execute(actor, { name: 'Routine 6', dayOfWeeks: ['monday'] }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          name: 'Routine 6',
          dayOfWeeks: ['monday'],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.ROUTINE_LIMIT_EXCEEDED,
        );
      }
    });

    it('should allow creation when user has fewer than 5 routines', async () => {
      (routineRepository.existsByNameForUser as jest.Mock).mockResolvedValue(
        false,
      );
      (routineRepository.countByUserId as jest.Mock).mockResolvedValue(4);
      (routineRepository.save as jest.Mock).mockImplementation(
        (routine: Routine) => Promise.resolve(routine),
      );

      const result = await useCase.execute(actor, {
        name: 'Routine 5',
        dayOfWeeks: ['monday'],
      });
      expect(result.name).toBe('Routine 5');
    });
  });

  describe('successful creation', () => {
    it('should create a routine with valid data', async () => {
      (routineRepository.existsByNameForUser as jest.Mock).mockResolvedValue(
        false,
      );
      (routineRepository.countByUserId as jest.Mock).mockResolvedValue(0);
      (routineRepository.save as jest.Mock).mockImplementation(
        (routine: Routine) => Promise.resolve(routine),
      );

      const result = await useCase.execute(actor, {
        name: 'My Routine',
        dayOfWeeks: ['monday', 'wednesday', 'friday'],
      });

      expect(result.name).toBe('My Routine');
      expect(result.userId).toBe('user-1');
      expect(result.days).toHaveLength(3);
      expect(result.days[0].dayOfWeek).toBe('monday');
      expect(result.days[1].dayOfWeek).toBe('wednesday');
      expect(result.days[2].dayOfWeek).toBe('friday');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.isActive).toBe(true);
    });

    it('should reject an invalid day of week', async () => {
      (routineRepository.existsByNameForUser as jest.Mock).mockResolvedValue(
        false,
      );
      (routineRepository.countByUserId as jest.Mock).mockResolvedValue(0);

      await expect(
        useCase.execute(actor, {
          name: 'My Routine',
          dayOfWeeks: ['invalidday'],
        }),
      ).rejects.toThrow(RoutineDomainError);
    });
  });

  describe('RF-09.0.3: Auto-assign first routine as active', () => {
    it('should set isActive=true when user has 0 existing routines', async () => {
      (routineRepository.existsByNameForUser as jest.Mock).mockResolvedValue(
        false,
      );
      (routineRepository.countByUserId as jest.Mock).mockResolvedValue(0);
      (routineRepository.save as jest.Mock).mockImplementation(
        (routine: Routine) => Promise.resolve(routine),
      );

      const result = await useCase.execute(actor, {
        name: 'First Routine',
        dayOfWeeks: ['monday'],
      });

      expect(result.isActive).toBe(true);
    });

    it('should set isActive=false when user already has routines', async () => {
      (routineRepository.existsByNameForUser as jest.Mock).mockResolvedValue(
        false,
      );
      (routineRepository.countByUserId as jest.Mock).mockResolvedValue(2);
      (routineRepository.save as jest.Mock).mockImplementation(
        (routine: Routine) => Promise.resolve(routine),
      );

      const result = await useCase.execute(actor, {
        name: 'Third Routine',
        dayOfWeeks: ['monday'],
      });

      expect(result.isActive).toBe(false);
    });
  });
});

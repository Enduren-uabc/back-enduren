import { AddExerciseToRoutineDayUseCase } from './add-exercise-to-routine-day.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../../domain/entities/exercise.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

describe('AddExerciseToRoutineDayUseCase', () => {
  let useCase: AddExerciseToRoutineDayUseCase;
  let routineRepository: RoutineRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  beforeEach(() => {
    routineRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      existsByNameForUser: jest.fn(),
      countByUserId: jest.fn(),
    };
    useCase = new AddExerciseToRoutineDayUseCase(routineRepository);
  });

  const createRoutineWithDay = (
    dayOfWeek: string,
    exerciseCount: number = 0,
  ): Routine => {
    const exercises = Array.from({ length: exerciseCount }, (_, i) =>
      Exercise.reconstitute(`ex-${i}`, `Exercise ${i}`, i),
    );
    const day = RoutineDay.reconstitute(
      dayOfWeek as
        | 'monday'
        | 'tuesday'
        | 'wednesday'
        | 'thursday'
        | 'friday'
        | 'saturday'
        | 'sunday',
      exercises,
    );
    return Routine.reconstitute(
      'routine-1',
      'My Routine',
      'user-1',
      [day],
      new Date(),
      new Date(),
    );
  };

  describe('happy path', () => {
    it('should add an exercise to an existing day', async () => {
      const routine = createRoutineWithDay('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        name: 'Push-ups',
      });

      expect(result.id).toBe('routine-1');
      expect(result.days[0].exercises).toHaveLength(1);
      expect(result.days[0].exercises[0].name).toBe('Push-ups');
    });

    it('should add exercise with explicit order', async () => {
      const routine = createRoutineWithDay('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        name: 'Push-ups',
        order: 5,
      });

      expect(result.days[0].exercises[0].order).toBe(5);
    });
  });

  describe('routine not found', () => {
    it('should reject when routine does not exist', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute(actor, {
          routineId: 'nonexistent',
          dayOfWeek: 'monday',
          name: 'Push-ups',
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'nonexistent',
          dayOfWeek: 'monday',
          name: 'Push-ups',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.ROUTINE_NOT_FOUND,
        );
      }
    });
  });

  describe('day not found', () => {
    it('should reject when day does not exist in routine (RF-10.0.2)', async () => {
      const routine = createRoutineWithDay('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'friday',
          name: 'Push-ups',
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'friday',
          name: 'Push-ups',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
        );
      }
    });
  });

  describe('exercise limit exceeded', () => {
    it('should reject when day has 10 exercises (RF-10.0.4, RF-10.0.5)', async () => {
      const routine = createRoutineWithDay('monday', 10);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          name: 'Extra Exercise',
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          name: 'Extra Exercise',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_DAY_LIMIT_EXCEEDED,
        );
      }
    });
  });

  describe('empty name rejection', () => {
    it('should reject an empty exercise name', async () => {
      const routine = createRoutineWithDay('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          name: '',
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          name: '',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_NAME_REQUIRED,
        );
      }
    });

    it('should reject a whitespace-only exercise name', async () => {
      const routine = createRoutineWithDay('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          name: '   ',
        }),
      ).rejects.toThrow(RoutineDomainError);
    });
  });
});

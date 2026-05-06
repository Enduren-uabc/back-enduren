import { ConfigureExerciseUseCase } from './configure-exercise.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../../domain/entities/exercise.entity';
import { ExerciseConfiguration } from '../../../domain/value-objects/exercise-configuration.value-object';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

describe('ConfigureExerciseUseCase', () => {
  let useCase: ConfigureExerciseUseCase;
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
    useCase = new ConfigureExerciseUseCase(routineRepository);
  });

  const createRoutineWithExercise = (
    dayOfWeek: string,
    exerciseId: string = 'ex-1',
  ): Routine => {
    const exercise = Exercise.create(exerciseId, 'Push-ups', 0);
    const day = RoutineDay.reconstitute(
      dayOfWeek as
        | 'monday'
        | 'tuesday'
        | 'wednesday'
        | 'thursday'
        | 'friday'
        | 'saturday'
        | 'sunday',
      [exercise],
    );
    return Routine.reconstitute(
      'routine-1',
      'My Routine',
      'user-1',
      [day],
      false,
      new Date(),
      new Date(),
    );
  };

  describe('happy path (RF-11.0.5, RF-11.0.6)', () => {
    it('should configure an exercise with valid sets, repsPerSet and weight', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        exerciseId: 'ex-1',
        sets: 3,
        repsPerSet: 12,
        weight: 50,
      });

      expect(result.id).toBe('routine-1');
      expect(result.days[0].exercises[0].id).toBe('ex-1');
      expect(result.days[0].exercises[0].sets).toBe(3);
      expect(result.days[0].exercises[0].repsPerSet).toBe(12);
      expect(result.days[0].exercises[0].weight).toBe(50);
    });

    it('should configure an exercise with minimum valid values', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        exerciseId: 'ex-1',
        sets: 1,
        repsPerSet: 1,
        weight: 0,
      });

      expect(result.days[0].exercises[0].sets).toBe(1);
      expect(result.days[0].exercises[0].repsPerSet).toBe(1);
      expect(result.days[0].exercises[0].weight).toBe(0);
    });

    it('should configure an exercise with maximum valid values', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        exerciseId: 'ex-1',
        sets: 10,
        repsPerSet: 50,
        weight: 999.99,
      });

      expect(result.days[0].exercises[0].sets).toBe(10);
      expect(result.days[0].exercises[0].repsPerSet).toBe(50);
      expect(result.days[0].exercises[0].weight).toBe(999.99);
    });

    it('should re-configure an already configured exercise', async () => {
      const exercise = Exercise.reconstitute(
        'ex-1',
        'Push-ups',
        0,
        ExerciseConfiguration.reconstitute(3, 12, 50),
      );
      const day = RoutineDay.reconstitute('monday', [exercise]);
      const routine = Routine.reconstitute(
        'routine-1',
        'My Routine',
        'user-1',
        [day],
        false,
        new Date(),
        new Date(),
      );
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        exerciseId: 'ex-1',
        sets: 5,
        repsPerSet: 8,
        weight: 60,
      });

      expect(result.days[0].exercises[0].sets).toBe(5);
      expect(result.days[0].exercises[0].repsPerSet).toBe(8);
      expect(result.days[0].exercises[0].weight).toBe(60);
    });
  });

  describe('routine not found', () => {
    it('should reject when routine does not exist', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute(actor, {
          routineId: 'nonexistent',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: 3,
          repsPerSet: 12,
          weight: 50,
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'nonexistent',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: 3,
          repsPerSet: 12,
          weight: 50,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.ROUTINE_NOT_FOUND,
        );
      }
    });
  });

  describe('exercise not found', () => {
    it('should reject when exercise does not exist in day', async () => {
      const routine = createRoutineWithExercise('monday', 'ex-1');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'nonexistent-exercise',
          sets: 3,
          repsPerSet: 12,
          weight: 50,
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'nonexistent-exercise',
          sets: 3,
          repsPerSet: 12,
          weight: 50,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_NOT_FOUND,
        );
      }
    });
  });

  describe('day not found', () => {
    it('should reject when day does not exist in routine', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'friday',
          exerciseId: 'ex-1',
          sets: 3,
          repsPerSet: 12,
          weight: 50,
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'friday',
          exerciseId: 'ex-1',
          sets: 3,
          repsPerSet: 12,
          weight: 50,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
        );
      }
    });
  });

  describe('invalid configuration values', () => {
    it('should reject sets out of range (RF-11.0.1)', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: 0,
          repsPerSet: 10,
          weight: 50,
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: 0,
          repsPerSet: 10,
          weight: 50,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_SETS_OUT_OF_RANGE,
        );
      }
    });

    it('should reject repsPerSet out of range (RF-11.0.2)', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: 3,
          repsPerSet: 0,
          weight: 50,
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: 3,
          repsPerSet: 0,
          weight: 50,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_REPS_OUT_OF_RANGE,
        );
      }
    });

    it('should reject negative weight (RF-11.0.3)', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: 3,
          repsPerSet: 12,
          weight: -5,
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: 3,
          repsPerSet: 12,
          weight: -5,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_WEIGHT_INVALID,
        );
      }
    });
  });
});

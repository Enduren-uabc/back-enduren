import { ConfigureExerciseUseCase } from './configure-exercise.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../../domain/entities/exercise.entity';
import { RoutineExerciseSet } from '../../../domain/value-objects/routine-exercise-set.value-object';
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
      findByIdAndUserId: jest.fn(),
      delete: jest.fn(),
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
    it('should configure an exercise with valid sets', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        exerciseId: 'ex-1',
        sets: [
          { setNumber: 1, reps: 12, weight: 50 },
          { setNumber: 2, reps: 10, weight: 45 },
          { setNumber: 3, reps: 8, weight: 40 },
        ],
      });

      expect(result.id).toBe('routine-1');
      expect(result.days[0].exercises[0].id).toBe('ex-1');
      expect(result.days[0].exercises[0].sets).toHaveLength(3);
      expect(result.days[0].exercises[0].sets[0].setNumber).toBe(1);
      expect(result.days[0].exercises[0].sets[0].reps).toBe(12);
      expect(result.days[0].exercises[0].sets[0].weight).toBe(50);
      expect(result.days[0].exercises[0].sets[2].reps).toBe(8);
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
        sets: [{ setNumber: 1, reps: 1, weight: 0 }],
      });

      expect(result.days[0].exercises[0].sets).toHaveLength(1);
      expect(result.days[0].exercises[0].sets[0].reps).toBe(1);
      expect(result.days[0].exercises[0].sets[0].weight).toBe(0);
    });

    it('should configure an exercise with restSeconds', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        exerciseId: 'ex-1',
        sets: [{ setNumber: 1, reps: 10, weight: 60, restSeconds: 90 }],
      });

      expect(result.days[0].exercises[0].sets[0].restSeconds).toBe(90);
    });

    it('should re-configure an already configured exercise', async () => {
      const exercise = Exercise.reconstitute('ex-1', 'Push-ups', 0, [
        RoutineExerciseSet.reconstitute('s-1', 1, 12, 50, null),
        RoutineExerciseSet.reconstitute('s-2', 2, 12, 50, null),
      ]);
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
        sets: [
          { setNumber: 1, reps: 8, weight: 60 },
          { setNumber: 2, reps: 8, weight: 60 },
          { setNumber: 3, reps: 6, weight: 70 },
        ],
      });

      expect(result.days[0].exercises[0].sets).toHaveLength(3);
      expect(result.days[0].exercises[0].sets[0].reps).toBe(8);
      expect(result.days[0].exercises[0].sets[0].weight).toBe(60);
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
          sets: [{ setNumber: 1, reps: 10, weight: 50 }],
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'nonexistent',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: [{ setNumber: 1, reps: 10, weight: 50 }],
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
          sets: [{ setNumber: 1, reps: 10, weight: 50 }],
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'nonexistent-exercise',
          sets: [{ setNumber: 1, reps: 10, weight: 50 }],
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
          sets: [{ setNumber: 1, reps: 10, weight: 50 }],
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'friday',
          exerciseId: 'ex-1',
          sets: [{ setNumber: 1, reps: 10, weight: 50 }],
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
    it('should reject empty sets array', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: [],
        }),
      ).rejects.toThrow(RoutineDomainError);
    });

    it('should reject reps out of range (RF-11.0.2)', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: [{ setNumber: 1, reps: 0, weight: 50 }],
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: [{ setNumber: 1, reps: 0, weight: 50 }],
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
          sets: [{ setNumber: 1, reps: 12, weight: -5 }],
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'ex-1',
          sets: [{ setNumber: 1, reps: 12, weight: -5 }],
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

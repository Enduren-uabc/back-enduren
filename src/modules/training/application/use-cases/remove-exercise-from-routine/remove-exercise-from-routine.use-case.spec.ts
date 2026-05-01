import { RemoveExerciseFromRoutineUseCase } from './remove-exercise-from-routine.use-case';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../../domain/entities/exercise.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

describe('RemoveExerciseFromRoutineUseCase', () => {
  let useCase: RemoveExerciseFromRoutineUseCase;
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
    useCase = new RemoveExerciseFromRoutineUseCase(routineRepository);
  });

  const createRoutineWithExercise = (
    dayOfWeek: string,
    exerciseCount: number = 1,
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

  describe('happy path (RF-10.0.6)', () => {
    it('should remove an exercise from a routine day', async () => {
      const routine = createRoutineWithExercise('monday', 2);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        exerciseId: 'ex-0',
      });

      expect(result.id).toBe('routine-1');
      expect(result.days[0].exercises).toHaveLength(1);
      expect(result.days[0].exercises[0].id).toBe('ex-1');
    });

    it('should remove the only exercise from a day, leaving it empty', async () => {
      const routine = createRoutineWithExercise('monday', 1);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        dayOfWeek: 'monday',
        exerciseId: 'ex-0',
      });

      expect(result.days[0].exercises).toHaveLength(0);
    });
  });

  describe('routine not found', () => {
    it('should reject when routine does not exist', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute(actor, {
          routineId: 'nonexistent',
          dayOfWeek: 'monday',
          exerciseId: 'ex-0',
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'nonexistent',
          dayOfWeek: 'monday',
          exerciseId: 'ex-0',
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
    it('should reject when day does not exist in routine', async () => {
      const routine = createRoutineWithExercise('monday');
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'friday',
          exerciseId: 'ex-0',
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'friday',
          exerciseId: 'ex-0',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
        );
      }
    });
  });

  describe('exercise not found', () => {
    it('should reject when exercise does not exist in day (RF-10.0.6)', async () => {
      const routine = createRoutineWithExercise('monday', 1);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'nonexistent-exercise',
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          dayOfWeek: 'monday',
          exerciseId: 'nonexistent-exercise',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_NOT_FOUND,
        );
      }
    });
  });
});

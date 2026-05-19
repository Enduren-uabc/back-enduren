import { SyncRoutineUseCase } from './sync-routine.use-case';
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

describe('SyncRoutineUseCase', () => {
  let useCase: SyncRoutineUseCase;
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
    useCase = new SyncRoutineUseCase(routineRepository);
  });

  const createRoutineWithExercises = (
    dayOfWeek: string,
    exercises: Array<{
      id: string;
      name: string;
      order: number;
      sets?: Array<{ setNumber: number; reps: number; weight: number }>;
    }>,
  ): Routine => {
    const exerciseEntities = exercises.map((ex) => {
      const sets =
        ex.sets !== undefined && ex.sets.length > 0
          ? ex.sets.map((s) =>
              RoutineExerciseSet.reconstitute(
                crypto.randomUUID(),
                s.setNumber,
                s.reps,
                s.weight,
                null,
              ),
            )
          : [];
      return Exercise.reconstitute(ex.id, ex.name, ex.order, sets);
    });
    const day = RoutineDay.reconstitute(
      dayOfWeek as
        | 'monday'
        | 'tuesday'
        | 'wednesday'
        | 'thursday'
        | 'friday'
        | 'saturday'
        | 'sunday',
      exerciseEntities,
      `day-${dayOfWeek}`,
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

  describe('happy path', () => {
    it('should add a new exercise to a day', async () => {
      const routine = createRoutineWithExercises('monday', []);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        days: [
          {
            dayOfWeek: 'monday',
            exercises: [{ name: 'Push-ups', order: 0 }],
          },
        ],
      });

      expect(result.days[0].exercises).toHaveLength(1);
      expect(result.days[0].exercises[0].name).toBe('Push-ups');
      expect(result.days[0].exercises[0].order).toBe(0);
      expect(result.days[0].exercises[0].sets).toHaveLength(0);
    });

    it('should update an existing exercise name and order', async () => {
      const routine = createRoutineWithExercises('monday', [
        { id: 'ex-1', name: 'Old Name', order: 0 },
      ]);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        days: [
          {
            dayOfWeek: 'monday',
            exercises: [{ id: 'ex-1', name: 'New Name', order: 1 }],
          },
        ],
      });

      expect(result.days[0].exercises[0].id).toBe('ex-1');
      expect(result.days[0].exercises[0].name).toBe('New Name');
      expect(result.days[0].exercises[0].order).toBe(1);
    });

    it('should configure an existing exercise with detailed sets', async () => {
      const routine = createRoutineWithExercises('monday', [
        { id: 'ex-1', name: 'Squats', order: 0 },
      ]);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        days: [
          {
            dayOfWeek: 'monday',
            exercises: [
              {
                id: 'ex-1',
                name: 'Squats',
                order: 0,
                sets: [
                  { setNumber: 1, reps: 8, weight: 80 },
                  { setNumber: 2, reps: 8, weight: 80 },
                  { setNumber: 3, reps: 6, weight: 85 },
                ],
              },
            ],
          },
        ],
      });

      expect(result.days[0].exercises[0].sets).toHaveLength(3);
      expect(result.days[0].exercises[0].sets[0].setNumber).toBe(1);
      expect(result.days[0].exercises[0].sets[0].reps).toBe(8);
      expect(result.days[0].exercises[0].sets[0].weight).toBe(80);
      expect(result.days[0].exercises[0].sets[2].reps).toBe(6);
      expect(result.days[0].exercises[0].sets[2].weight).toBe(85);
    });

    it('should remove exercises not present in the payload', async () => {
      const routine = createRoutineWithExercises('monday', [
        { id: 'ex-1', name: 'Keep Me', order: 0 },
        { id: 'ex-2', name: 'Remove Me', order: 1 },
      ]);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        days: [
          {
            dayOfWeek: 'monday',
            exercises: [{ id: 'ex-1', name: 'Keep Me', order: 0 }],
          },
        ],
      });

      expect(result.days[0].exercises).toHaveLength(1);
      expect(result.days[0].exercises[0].id).toBe('ex-1');
    });

    it('should handle multiple days independently', async () => {
      const mondayExercises = [Exercise.reconstitute('ex-1', 'Bench Press', 0)];
      const tuesdayExercises = [Exercise.reconstitute('ex-2', 'Squats', 0)];
      const day1 = RoutineDay.reconstitute(
        'monday',
        mondayExercises,
        'day-monday',
      );
      const day2 = RoutineDay.reconstitute(
        'tuesday',
        tuesdayExercises,
        'day-tuesday',
      );
      const routine = Routine.reconstitute(
        'routine-1',
        'My Routine',
        'user-1',
        [day1, day2],
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
        days: [
          {
            dayOfWeek: 'monday',
            exercises: [
              { id: 'ex-1', name: 'Bench Press', order: 0 },
              { name: 'Incline Press', order: 1 },
            ],
          },
          {
            dayOfWeek: 'tuesday',
            exercises: [{ id: 'ex-2', name: 'Squats', order: 0 }],
          },
        ],
      });

      expect(result.days).toHaveLength(2);
      expect(result.days[0].exercises).toHaveLength(2);
      expect(result.days[1].exercises).toHaveLength(1);
    });

    it('should preserve existing configuration when not provided in payload', async () => {
      const routine = createRoutineWithExercises('monday', [
        {
          id: 'ex-1',
          name: 'Squats',
          order: 0,
          sets: [
            { setNumber: 1, reps: 10, weight: 60 },
            { setNumber: 2, reps: 10, weight: 60 },
          ],
        },
      ]);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);
      (routineRepository.save as jest.Mock).mockImplementation((r: Routine) =>
        Promise.resolve(r),
      );

      const result = await useCase.execute(actor, {
        routineId: 'routine-1',
        days: [
          {
            dayOfWeek: 'monday',
            exercises: [{ id: 'ex-1', name: 'Squats', order: 0 }],
          },
        ],
      });

      expect(result.days[0].exercises[0].sets).toHaveLength(2);
      expect(result.days[0].exercises[0].sets[0].reps).toBe(10);
      expect(result.days[0].exercises[0].sets[0].weight).toBe(60);
    });
  });

  describe('routine not found', () => {
    it('should reject when routine does not exist', async () => {
      (routineRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute(actor, {
          routineId: 'nonexistent',
          days: [{ dayOfWeek: 'monday', exercises: [] }],
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'nonexistent',
          days: [{ dayOfWeek: 'monday', exercises: [] }],
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
    it('should reject when a payload day does not exist in routine', async () => {
      const routine = createRoutineWithExercises('monday', []);
      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      await expect(
        useCase.execute(actor, {
          routineId: 'routine-1',
          days: [
            { dayOfWeek: 'monday', exercises: [] },
            { dayOfWeek: 'friday', exercises: [] },
          ],
        }),
      ).rejects.toThrow(RoutineDomainError);

      try {
        await useCase.execute(actor, {
          routineId: 'routine-1',
          days: [
            { dayOfWeek: 'monday', exercises: [] },
            { dayOfWeek: 'friday', exercises: [] },
          ],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
        );
      }
    });
  });
});

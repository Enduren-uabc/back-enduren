import { GetWorkoutSessionHistoryUseCase } from './get-workout-session-history.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import { Routine } from '../../../domain/entities/routine.entity';

describe('GetWorkoutSessionHistoryUseCase', () => {
  let useCase: GetWorkoutSessionHistoryUseCase;
  let workoutSessionRepository: WorkoutSessionRepository;
  let routineRepository: RoutineRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const exercise = WorkoutExercise.create('exercise-1', 'Bench Press', 1, [
    { setNumber: 1, reps: 10, weight: 50 },
    { setNumber: 2, reps: 10, weight: 50 },
    { setNumber: 3, reps: 8, weight: 55 },
  ]);

  beforeEach(() => {
    workoutSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findInProgressByUserId: jest.fn(),
      findFinishedByUserId: jest.fn(),
    };
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
    useCase = new GetWorkoutSessionHistoryUseCase(
      workoutSessionRepository,
      routineRepository,
    );
  });

  describe('RF-13, RF-13.0.1, RF-13.0.5: List finished sessions', () => {
    it('should return finished sessions ordered by date descending with summary data', async () => {
      const session1 = WorkoutSession.reconstitute(
        'session-1',
        'user-1',
        'routine-1',
        'finished',
        [exercise],
        0,
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      const session2 = WorkoutSession.reconstitute(
        'session-2',
        'user-1',
        'routine-1',
        'finished',
        [exercise],
        0,
        new Date('2026-04-25T10:00:00Z'),
        new Date('2026-04-25T10:45:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserId as jest.Mock
      ).mockResolvedValue([session2, session1]);

      const routine = Routine.reconstitute(
        'routine-1',
        'My Routine',
        'user-1',
        [],
        true,
        new Date(),
        new Date(),
      );

      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      const result = await useCase.execute(actor);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-2');
      expect(result[1].id).toBe('session-1');
      expect(result[0].routineId).toBe('routine-1');
      expect(result[0].routineName).toBe('My Routine');
      expect(result[0].exerciseCount).toBe(1);
      expect(result[0].status).toBe('finished');
      expect(result[0].durationMinutes).toBe(45);
      expect(result[1].durationMinutes).toBe(60);
    });

    it('should return empty array when no finished sessions exist', async () => {
      (
        workoutSessionRepository.findFinishedByUserId as jest.Mock
      ).mockResolvedValue([]);

      const result = await useCase.execute(actor);

      expect(result).toEqual([]);
    });

    it('should resolve routine names for different routines', async () => {
      const exercise2 = WorkoutExercise.create('exercise-2', 'Squat', 1, [
        { setNumber: 1, reps: 10, weight: 80 },
        { setNumber: 2, reps: 10, weight: 80 },
        { setNumber: 3, reps: 8, weight: 85 },
      ]);

      const session1 = WorkoutSession.reconstitute(
        'session-1',
        'user-1',
        'routine-1',
        'finished',
        [exercise],
        0,
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T10:30:00Z'),
      );

      const session2 = WorkoutSession.reconstitute(
        'session-2',
        'user-1',
        'routine-2',
        'finished',
        [exercise2],
        0,
        new Date('2026-04-25T10:00:00Z'),
        new Date('2026-04-25T10:15:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserId as jest.Mock
      ).mockResolvedValue([session2, session1]);

      const routine1 = Routine.reconstitute(
        'routine-1',
        'Upper Body',
        'user-1',
        [],
        true,
        new Date(),
        new Date(),
      );

      const routine2 = Routine.reconstitute(
        'routine-2',
        'Leg Day',
        'user-1',
        [],
        false,
        new Date(),
        new Date(),
      );

      (routineRepository.findById as jest.Mock).mockImplementation(
        (id: string) => {
          if (id === 'routine-1') return Promise.resolve(routine1);
          if (id === 'routine-2') return Promise.resolve(routine2);
          return Promise.resolve(null);
        },
      );

      const result = await useCase.execute(actor);

      expect(result).toHaveLength(2);
      expect(result[0].routineName).toBe('Leg Day');
      expect(result[1].routineName).toBe('Upper Body');
    });

    it('should use Unknown Routine when routine is not found', async () => {
      const session = WorkoutSession.reconstitute(
        'session-1',
        'user-1',
        'routine-deleted',
        'finished',
        [exercise],
        0,
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T10:30:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserId as jest.Mock
      ).mockResolvedValue([session]);

      (routineRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute(actor);

      expect(result).toHaveLength(1);
      expect(result[0].routineName).toBe('Unknown Routine');
    });

    it('should compute durationMinutes rounded to 1 decimal', async () => {
      // 37 minutes = 37.0
      const session = WorkoutSession.reconstitute(
        'session-1',
        'user-1',
        'routine-1',
        'finished',
        [exercise],
        0,
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T10:37:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserId as jest.Mock
      ).mockResolvedValue([session]);

      const routine = Routine.reconstitute(
        'routine-1',
        'Test',
        'user-1',
        [],
        true,
        new Date(),
        new Date(),
      );

      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      const result = await useCase.execute(actor);

      expect(result[0].durationMinutes).toBe(37);
    });

    it('should compute durationMinutes with decimal precision', async () => {
      // 45.5 minutes
      const session = WorkoutSession.reconstitute(
        'session-1',
        'user-1',
        'routine-1',
        'finished',
        [exercise],
        0,
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T10:45:30Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserId as jest.Mock
      ).mockResolvedValue([session]);

      const routine = Routine.reconstitute(
        'routine-1',
        'Test',
        'user-1',
        [],
        true,
        new Date(),
        new Date(),
      );

      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      const result = await useCase.execute(actor);

      expect(result[0].durationMinutes).toBe(45.5);
    });
  });
});

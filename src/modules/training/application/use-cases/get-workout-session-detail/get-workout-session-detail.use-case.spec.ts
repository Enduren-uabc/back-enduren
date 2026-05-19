import { GetWorkoutSessionDetailUseCase } from './get-workout-session-detail.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import { Routine } from '../../../domain/entities/routine.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';

describe('GetWorkoutSessionDetailUseCase', () => {
  let useCase: GetWorkoutSessionDetailUseCase;
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
    useCase = new GetWorkoutSessionDetailUseCase(
      workoutSessionRepository,
      routineRepository,
    );
  });

  describe('RF-13.0.2: Get session detail', () => {
    it('should return full session detail with duration and routine name', async () => {
      const session = WorkoutSession.reconstitute(
        'session-1',
        'user-1',
        'routine-1',
        'finished',
        [exercise],
        0,
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );

      const routine = Routine.reconstitute(
        'routine-1',
        'My Routine',
        'user-1',
        [RoutineDay.reconstitute('monday', [])],
        true,
        new Date(),
        new Date(),
      );

      (routineRepository.findById as jest.Mock).mockResolvedValue(routine);

      const result = await useCase.execute(actor, { sessionId: 'session-1' });

      expect(result.id).toBe('session-1');
      expect(result.userId).toBe('user-1');
      expect(result.routineId).toBe('routine-1');
      expect(result.routineName).toBe('My Routine');
      expect(result.status).toBe('finished');
      expect(result.currentExerciseIndex).toBe(0);
      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].exerciseId).toBe('exercise-1');
      expect(result.exercises[0].exerciseName).toBe('Bench Press');
      expect(result.exercises[0].targetSets).toHaveLength(3);
      expect(result.exercises[0].workoutSets).toHaveLength(3);
      expect(result.durationMinutes).toBe(60);
      expect(result.startedAt).toEqual(new Date('2026-04-20T10:00:00Z'));
      expect(result.finishedAt).toEqual(new Date('2026-04-20T11:00:00Z'));
    });

    it('should return null durationMinutes for in-progress session', async () => {
      const session = WorkoutSession.reconstitute(
        'session-1',
        'user-1',
        'routine-1',
        'in_progress',
        [exercise],
        0,
        new Date('2026-04-20T10:00:00Z'),
        null,
      );

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );

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

      const result = await useCase.execute(actor, { sessionId: 'session-1' });

      expect(result.durationMinutes).toBeNull();
    });

    it('should throw SESSION_NOT_FOUND when session does not exist', async () => {
      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute(actor, { sessionId: 'nonexistent' }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, { sessionId: 'nonexistent' });
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NOT_FOUND,
        );
      }
    });

    it('should throw SESSION_NOT_OWNED when session belongs to another user', async () => {
      const session = WorkoutSession.reconstitute(
        'session-1',
        'user-2',
        'routine-1',
        'finished',
        [exercise],
        0,
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );

      await expect(
        useCase.execute(actor, { sessionId: 'session-1' }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, { sessionId: 'session-1' });
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NOT_OWNED,
        );
      }
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

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );

      (routineRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await useCase.execute(actor, { sessionId: 'session-1' });

      expect(result.routineName).toBe('Unknown Routine');
    });

    it('should compute durationMinutes rounded to 1 decimal', async () => {
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

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );

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

      const result = await useCase.execute(actor, { sessionId: 'session-1' });

      expect(result.durationMinutes).toBe(45.5);
    });
  });
});

import { DiscardWorkoutSessionUseCase } from './discard-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';

describe('DiscardWorkoutSessionUseCase', () => {
  let useCase: DiscardWorkoutSessionUseCase;
  let workoutSessionRepository: WorkoutSessionRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const exercise = WorkoutExercise.create('exercise-1', 'Bench Press', 1, [
    { setNumber: 1, reps: 10, weight: 50 },
    { setNumber: 2, reps: 10, weight: 50 },
  ]);

  beforeEach(() => {
    workoutSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findInProgressByUserId: jest.fn(),
    };
    useCase = new DiscardWorkoutSessionUseCase(workoutSessionRepository);
  });

  describe('Happy path: discard in-progress session', () => {
    it('should discard an in-progress session', async () => {
      const session = WorkoutSession.create(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
      );

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );
      (workoutSessionRepository.save as jest.Mock).mockImplementation(
        (s: WorkoutSession) => Promise.resolve(s),
      );

      const result = await useCase.execute(actor, {
        sessionId: 'session-1',
      });

      expect(result.status).toBe('discarded');
      expect(result.finishedAt).toBeInstanceOf(Date);
      expect(result.id).toBe('session-1');
      expect(result.userId).toBe('user-1');
    });
  });

  describe('SESSION_NOT_FOUND error', () => {
    it('should reject when session does not exist', async () => {
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

    it('should reject when session belongs to another user', async () => {
      const otherUserSession = WorkoutSession.create(
        'session-2',
        'user-2',
        'routine-1',
        [exercise],
      );
      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        otherUserSession,
      );

      await expect(
        useCase.execute(actor, { sessionId: 'session-2' }),
      ).rejects.toThrow(WorkoutSessionDomainError);
    });
  });

  describe('session not in progress', () => {
    it('should reject when session is already finished', async () => {
      const session = WorkoutSession.create(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
      );
      const finishedSession = session.finish();

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        finishedSession,
      );

      await expect(
        useCase.execute(actor, { sessionId: 'session-1' }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, { sessionId: 'session-1' });
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        );
      }
    });

    it('should reject when session is already discarded', async () => {
      const session = WorkoutSession.create(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
      );
      const discardedSession = session.discard();

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        discardedSession,
      );

      await expect(
        useCase.execute(actor, { sessionId: 'session-1' }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, { sessionId: 'session-1' });
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        );
      }
    });
  });
});

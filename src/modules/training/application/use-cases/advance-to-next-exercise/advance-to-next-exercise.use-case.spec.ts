import { AdvanceToNextExerciseUseCase } from './advance-to-next-exercise.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';

describe('AdvanceToNextExerciseUseCase', () => {
  let useCase: AdvanceToNextExerciseUseCase;
  let workoutSessionRepository: WorkoutSessionRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const exercise1 = WorkoutExercise.create('exercise-1', 'Bench Press', 1, [
    { setNumber: 1, reps: 10, weight: 50 },
    { setNumber: 2, reps: 10, weight: 50 },
  ]);

  const exercise2 = WorkoutExercise.create('exercise-2', 'Squat', 2, [
    { setNumber: 1, reps: 8, weight: 80 },
    { setNumber: 2, reps: 8, weight: 80 },
    { setNumber: 3, reps: 6, weight: 85 },
  ]);

  beforeEach(() => {
    workoutSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findInProgressByUserId: jest.fn(),
    };
    useCase = new AdvanceToNextExerciseUseCase(workoutSessionRepository);
  });

  describe('RF-12.0.4: Advance to next exercise', () => {
    it('should advance to next exercise when all sets of current exercise are completed', async () => {
      let session = WorkoutSession.create('session-1', 'user-1', 'routine-1', [
        exercise1,
        exercise2,
      ]);
      session = session.registerSetRepsAndWeight(0, 1, 10, 50);
      session = session.markSetAsCompleted(0, 1);
      session = session.registerSetRepsAndWeight(0, 2, 10, 50);
      session = session.markSetAsCompleted(0, 2);

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );
      (workoutSessionRepository.save as jest.Mock).mockImplementation(
        (s: WorkoutSession) => Promise.resolve(s),
      );

      const result = await useCase.execute(actor, {
        sessionId: 'session-1',
      });

      expect(result.currentExerciseIndex).toBe(1);
    });

    it('should save the updated session', async () => {
      let session = WorkoutSession.create('session-1', 'user-1', 'routine-1', [
        exercise1,
        exercise2,
      ]);
      session = session.registerSetRepsAndWeight(0, 1, 10, 50);
      session = session.markSetAsCompleted(0, 1);
      session = session.registerSetRepsAndWeight(0, 2, 10, 50);
      session = session.markSetAsCompleted(0, 2);

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );
      const saveMock = jest
        .fn()
        .mockImplementation((s: WorkoutSession) => Promise.resolve(s));
      workoutSessionRepository.save = saveMock;

      await useCase.execute(actor, { sessionId: 'session-1' });

      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-1',
          currentExerciseIndex: 1,
        }),
      );
    });
  });

  describe('SESSION_NOT_FOUND error', () => {
    it('should reject when session does not exist', async () => {
      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute(actor, { sessionId: 'nonexistent' }),
      ).rejects.toThrow(WorkoutSessionDomainError);
    });

    it('should reject when session belongs to another user', async () => {
      const otherUserSession = WorkoutSession.create({
        id: 'session-2',
        userId: 'user-2',
        routineId: 'routine-1',
        exercises: [exercise1, exercise2],
      });
      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        otherUserSession,
      });

      await expect(
        useCase.execute(actor, { sessionId: 'session-2' }),
      ).rejects.toThrow(WorkoutSessionDomainError);
    });
  });

  describe('SESSION_ALREADY_FINISHED error', () => {
    it('should reject when session is already finished', async () => {
      let session = WorkoutSession.create('session-1', 'user-1', 'routine-1', [
        exercise1,
        exercise2,
      ]);
      session = session.finish();

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      });

      await expect(
        useCase.execute(actor, { sessionId: 'session-1' }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, { sessionId: 'session-1' });
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        );
      }
    });
  });
});

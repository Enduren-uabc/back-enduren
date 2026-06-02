import { MarkSetAsCompletedUseCase } from './mark-set-as-completed.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';

describe('MarkSetAsCompletedUseCase', () => {
  let useCase: MarkSetAsCompletedUseCase;
  let workoutSessionRepository: WorkoutSessionRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const exercise = WorkoutExercise.create('exercise-1', 'Bench Press', 1, [
    { setNumber: 1, reps: 10, weight: 50 },
    { setNumber: 2, reps: 10, weight: 50 },
    { setNumber: 3, reps: 10, weight: 50 },
  ]);

  beforeEach(() => {
    workoutSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findInProgressByUserId: jest.fn(),
    };
    useCase = new MarkSetAsCompletedUseCase(workoutSessionRepository);
  });

  describe('RF-12.0.3: Mark a set as completed', () => {
    it('should mark a set as completed using targets if not yet registered', async () => {
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
        exerciseIndex: 0,
        setNumber: 1,
      });

      expect(result.exercises[0].workoutSets[0].completed).toBe(true);
      expect(result.exercises[0].workoutSets[0].repsPerformed).toBe(10);
      expect(result.exercises[0].workoutSets[0].weightUsed).toBe(50);
    });

    it('should unmark a set (completed = false) when called on an already completed set (toggle behavior)', async () => {
      let session = WorkoutSession.create('session-1', 'user-1', 'routine-1', [
        exercise,
      ]);
      session = session.registerSetRepsAndWeight(0, 1, 10, 50);

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );
      (workoutSessionRepository.save as jest.Mock).mockImplementation(
        (s: WorkoutSession) => Promise.resolve(s),
      );

      // Al ejecutar el caso de uso de nuevo, debería desmarcarlo (completed = false)
      const result = await useCase.execute(actor, {
        sessionId: 'session-1',
        exerciseIndex: 0,
        setNumber: 1,
      });

      expect(result.exercises[0].workoutSets[0].completed).toBe(false);
      expect(result.exercises[0].workoutSets[0].repsPerformed).toBe(10);
      expect(result.exercises[0].workoutSets[0].weightUsed).toBe(50);
    });

    it('should save the updated session', async () => {
      let session = WorkoutSession.create('session-1', 'user-1', 'routine-1', [
        exercise,
      ]);
      session = session.registerSetRepsAndWeight(0, 1, 10, 50);

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );
      const saveMock = jest
        .fn()
        .mockImplementation((s: WorkoutSession) => Promise.resolve(s));
      workoutSessionRepository.save = saveMock;

      await useCase.execute(actor, {
        sessionId: 'session-1',
        exerciseIndex: 0,
        setNumber: 1,
      });

      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-1',
        }),
      );
    });
  });

  describe('SESSION_NOT_FOUND error', () => {
    it('should reject when session does not exist', async () => {
      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        useCase.execute(actor, {
          sessionId: 'nonexistent',
          exerciseIndex: 0,
          setNumber: 1,
        }),
      ).rejects.toThrow(WorkoutSessionDomainError);
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
        useCase.execute(actor, {
          sessionId: 'session-2',
          exerciseIndex: 0,
          setNumber: 1,
        }),
      ).rejects.toThrow(WorkoutSessionDomainError);
    });
  });

  describe('SESSION_ALREADY_FINISHED error', () => {
    it('should reject when session is already finished', async () => {
      let session = WorkoutSession.create('session-1', 'user-1', 'routine-1', [
        exercise,
      ]);
      session = session.finish();

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      );

      await expect(
        useCase.execute(actor, {
          sessionId: 'session-1',
          exerciseIndex: 0,
          setNumber: 1,
        }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, {
          sessionId: 'session-1',
          exerciseIndex: 0,
          setNumber: 1,
        });
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        );
      }
    });
  });
});

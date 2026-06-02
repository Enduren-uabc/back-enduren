import { RegisterSetRepsAndWeightUseCase } from './register-set-reps-and-weight.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';

describe('RegisterSetRepsAndWeightUseCase', () => {
  let useCase: RegisterSetRepsAndWeightUseCase;
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
    useCase = new RegisterSetRepsAndWeightUseCase(workoutSessionRepository);
  });

  describe('RF-12.0.2: Register reps and weight for a set', () => {
    it('should register reps and weight for a set in an in-progress session', async () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: 'user-1',
        routineId: 'routine-1',
        exercises: [exercise],
      });

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      });
      (workoutSessionRepository.save as jest.Mock).mockImplementation(
        (s: WorkoutSession) => Promise.resolve(s),
      });

      const result = await useCase.execute(actor, {
        sessionId: 'session-1',
        exerciseIndex: 0,
        setNumber: 1,
        repsPerformed: 10,
        weightUsed: 50,
      });

      expect(result.id).toBe('session-1');
      expect(result.exercises[0].workoutSets[0].repsPerformed).toBe(10);
      expect(result.exercises[0].workoutSets[0].weightUsed).toBe(50);
      expect(result.currentExerciseIndex).toBe(0);
    });

    it('should save the updated session', async () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: 'user-1',
        routineId: 'routine-1',
        exercises: [exercise],
      });

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        session,
      });
      const saveMock = jest
        .fn()
        .mockImplementation((s: WorkoutSession) => Promise.resolve(s));
      workoutSessionRepository.save = saveMock;

      await useCase.execute(actor, {
        sessionId: 'session-1',
        exerciseIndex: 0,
        setNumber: 1,
        repsPerformed: 10,
        weightUsed: 50,
      });

      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-1',
        }),
      });
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
          repsPerformed: 10,
          weightUsed: 50,
        }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, {
          sessionId: 'nonexistent',
          exerciseIndex: 0,
          setNumber: 1,
          repsPerformed: 10,
          weightUsed: 50,
        });
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NOT_FOUND,
        );
      }
    });

    it('should reject when session belongs to another user', async () => {
      const otherUserSession = WorkoutSession.create({
        id: 'session-2',
        userId: 'user-2',
        routineId: 'routine-1',
        exercises: [exercise],
      });
      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        otherUserSession,
      });

      await expect(
        useCase.execute(actor, {
          sessionId: 'session-2',
          exerciseIndex: 0,
          setNumber: 1,
          repsPerformed: 10,
          weightUsed: 50,
        }),
      ).rejects.toThrow(WorkoutSessionDomainError);
    });
  });

  describe('SESSION_ALREADY_FINISHED error', () => {
    it('should reject when session is already finished', async () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: 'user-1',
        routineId: 'routine-1',
        exercises: [exercise],
      });
      const finishedSession = session.finish();

      (workoutSessionRepository.findById as jest.Mock).mockResolvedValue(
        finishedSession,
      });

      await expect(
        useCase.execute(actor, {
          sessionId: 'session-1',
          exerciseIndex: 0,
          setNumber: 1,
          repsPerformed: 10,
          weightUsed: 50,
        }),
      ).rejects.toThrow(WorkoutSessionDomainError);

      try {
        await useCase.execute(actor, {
          sessionId: 'session-1',
          exerciseIndex: 0,
          setNumber: 1,
          repsPerformed: 10,
          weightUsed: 50,
        });
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        });
      }
    });
  });
});

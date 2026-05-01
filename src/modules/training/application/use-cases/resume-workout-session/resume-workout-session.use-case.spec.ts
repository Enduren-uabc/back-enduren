import { ResumeWorkoutSessionUseCase } from './resume-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../domain/errors/workout-session-domain.error';

describe('ResumeWorkoutSessionUseCase', () => {
  let useCase: ResumeWorkoutSessionUseCase;
  let workoutSessionRepository: WorkoutSessionRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  const exercise = WorkoutExercise.create(
    'exercise-1',
    'Bench Press',
    1,
    3,
    10,
    50,
  );

  beforeEach(() => {
    workoutSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findInProgressByUserId: jest.fn(),
    };
    useCase = new ResumeWorkoutSessionUseCase(workoutSessionRepository);
  });

  describe('RF-12.0.7: Resume in-progress session', () => {
    it('should return the in-progress session for the user', async () => {
      const session = WorkoutSession.create(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
      );

      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(session);

      const result = await useCase.execute(actor);

      expect(result.id).toBe('session-1');
      expect(result.userId).toBe('user-1');
      expect(result.routineId).toBe('routine-1');
      expect(result.status).toBe('in_progress');
      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].exerciseId).toBe('exercise-1');
      expect(result.exercises[0].workoutSets).toHaveLength(3);
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.finishedAt).toBeNull();
    });

    it('should return exercises with current set states', async () => {
      const session = WorkoutSession.create(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
      );

      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(session);

      const result = await useCase.execute(actor);

      expect(result.exercises[0].workoutSets[0].setNumber).toBe(1);
      expect(result.exercises[0].workoutSets[0].completed).toBe(false);
      expect(result.exercises[0].workoutSets[0].repsPerformed).toBeNull();
      expect(result.exercises[0].workoutSets[0].weightUsed).toBeNull();
    });
  });

  describe('SESSION_NOT_IN_PROGRESS error', () => {
    it('should reject when no session is in progress', async () => {
      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(null);

      await expect(useCase.execute(actor)).rejects.toThrow(
        WorkoutSessionDomainError,
      );

      try {
        await useCase.execute(actor);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NOT_IN_PROGRESS,
        );
      }
    });
  });
});

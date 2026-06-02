import {
  ResumeWorkoutSessionUseCase,
  ResumeWorkoutSessionOutput,
} from './resume-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';

describe('ResumeWorkoutSessionUseCase', () => {
  let useCase: ResumeWorkoutSessionUseCase;
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
      findFinishedByUserId: jest.fn(),
      findFinishedByUserIdAndExerciseId: jest.fn(),
    };
    useCase = new ResumeWorkoutSessionUseCase(workoutSessionRepository);
  });

  describe('RF-12.0.7: Resume in-progress session', () => {
    it('should return the in-progress session for the user', async () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: 'user-1',
        routineId: 'routine-1',
        exercises: [exercise],
      });

      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(session);

      const result = (await useCase.execute(
        actor,
      )) as NonNullable<ResumeWorkoutSessionOutput>;

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
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: 'user-1',
        routineId: 'routine-1',
        exercises: [exercise],
      });

      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(session);

      const result = (await useCase.execute(
        actor,
      )) as NonNullable<ResumeWorkoutSessionOutput>;

      expect(result.exercises[0].workoutSets[0].setNumber).toBe(1);
      expect(result.exercises[0].workoutSets[0].completed).toBe(false);
      expect(result.exercises[0].workoutSets[0].repsPerformed).toBeNull();
      expect(result.exercises[0].workoutSets[0].weightUsed).toBeNull();
    });
  });

  describe('no session in progress', () => {
    it('should return null when no session is in progress', async () => {
      (
        workoutSessionRepository.findInProgressByUserId as jest.Mock
      ).mockResolvedValue(null);

      const result = await useCase.execute(actor);

      expect(result).toBeNull();
    });
  });
});

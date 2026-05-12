import { GetExerciseProgressUseCase } from './get-exercise-progress.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';
import { WorkoutSession } from '../../../domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../domain/value-objects/workout-exercise.value-object';
import { WorkoutSet } from '../../../domain/value-objects/workout-set.value-object';

describe('GetExerciseProgressUseCase', () => {
  let useCase: GetExerciseProgressUseCase;
  let workoutSessionRepository: WorkoutSessionRepository;
  const actor: CurrentActor = { userId: 'user-1' };

  // Helper: create a WorkoutExercise with specific sets data
  const createExerciseWithSets = (
    exerciseId: string,
    exerciseName: string,
    sets: number,
    repsPerSet: number,
    weight: number,
    workoutSetsData: Array<{
      setNumber: number;
      repsPerformed: number | null;
      weightUsed: number | null;
      completed: boolean;
    }>,
  ): WorkoutExercise => {
    const targetSets = Array.from({ length: sets }, (_, i) => ({
      setNumber: i + 1,
      reps: repsPerSet,
      weight,
    }));
    const workoutSets = workoutSetsData.map((wsData) =>
      WorkoutSet.reconstitute(
        wsData.setNumber,
        wsData.repsPerformed,
        wsData.weightUsed,
        wsData.completed,
      ),
    );
    return WorkoutExercise.reconstitute(
      exerciseId,
      exerciseName,
      1,
      targetSets,
      workoutSets,
    );
  };

  // Helper: create a finished session with exercises
  const createFinishedSession = (
    id: string,
    userId: string,
    routineId: string,
    exercises: WorkoutExercise[],
    startedAt: Date,
    finishedAt: Date,
  ): WorkoutSession => {
    return WorkoutSession.reconstitute(
      id,
      userId,
      routineId,
      'finished',
      exercises,
      0,
      startedAt,
      finishedAt,
    );
  };

  beforeEach(() => {
    workoutSessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findInProgressByUserId: jest.fn(),
      findFinishedByUserId: jest.fn(),
      findFinishedByUserIdAndExerciseId: jest.fn(),
    };
    useCase = new GetExerciseProgressUseCase(workoutSessionRepository);
  });

  describe('RF-13.0.3, RF-13.0.4, RF-13.0.6: Exercise progress comparison', () => {
    it('should return progress records when 2+ finished sessions contain the exercise', async () => {
      const exercise1 = createExerciseWithSets(
        'exercise-1',
        'Bench Press',
        3,
        10,
        50,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 50, completed: true },
          { setNumber: 2, repsPerformed: 8, weightUsed: 55, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 50, completed: true },
        ],
      );

      const exercise2 = createExerciseWithSets(
        'exercise-1',
        'Bench Press',
        3,
        10,
        55,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 55, completed: true },
          { setNumber: 2, repsPerformed: 10, weightUsed: 60, completed: true },
          { setNumber: 3, repsPerformed: 9, weightUsed: 55, completed: true },
        ],
      );

      const session1 = createFinishedSession(
        'session-1',
        'user-1',
        'routine-1',
        [exercise1],
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      const session2 = createFinishedSession(
        'session-2',
        'user-1',
        'routine-1',
        [exercise2],
        new Date('2026-04-25T10:00:00Z'),
        new Date('2026-04-25T11:00:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([session1, session2]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-1',
      });

      expect(result.sufficientData).toBe(true);
      expect(result.exerciseId).toBe('exercise-1');
      expect(result.exerciseName).toBe('Bench Press');
      expect(result.message).toBeNull();
      expect(result.records).toHaveLength(2);

      // First session: max weight = 55, total reps = 10+8+10 = 28
      expect(result.records[0].sessionId).toBe('session-1');
      expect(result.records[0].weightUsed).toBe(55);
      expect(result.records[0].repsPerformed).toBe(28);
      expect(result.records[0].setsCompleted).toBe(3);
      expect(result.records[0].totalSets).toBe(3);

      // Second session: max weight = 60, total reps = 10+10+9 = 29
      expect(result.records[1].sessionId).toBe('session-2');
      expect(result.records[1].weightUsed).toBe(60);
      expect(result.records[1].repsPerformed).toBe(29);
      expect(result.records[1].setsCompleted).toBe(3);
      expect(result.records[1].totalSets).toBe(3);
    });

    it('should return insufficient data when only 1 session contains the exercise', async () => {
      const exercise = createExerciseWithSets(
        'exercise-1',
        'Bench Press',
        3,
        10,
        50,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 50, completed: true },
          { setNumber: 2, repsPerformed: 8, weightUsed: 55, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 50, completed: true },
        ],
      );

      const session = createFinishedSession(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([session]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-1',
      });

      expect(result.sufficientData).toBe(false);
      expect(result.exerciseId).toBe('exercise-1');
      expect(result.exerciseName).toBe('Bench Press');
      expect(result.records).toHaveLength(0);
      expect(result.message).toBe(
        'Insufficient data for progress comparison. At least 2 records are required.',
      );
    });

    it('should return insufficient data with Unknown Exercise when no sessions contain the exercise', async () => {
      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-nonexistent',
      });

      expect(result.sufficientData).toBe(false);
      expect(result.exerciseId).toBe('exercise-nonexistent');
      expect(result.exerciseName).toBe('Unknown Exercise');
      expect(result.records).toHaveLength(0);
      expect(result.message).toBe(
        'Insufficient data for progress comparison. At least 2 records are required.',
      );
    });

    it('should return records ordered chronologically (oldest first)', async () => {
      const exercise1 = createExerciseWithSets(
        'exercise-1',
        'Squat',
        3,
        10,
        80,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 80, completed: true },
          { setNumber: 2, repsPerformed: 10, weightUsed: 80, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 80, completed: true },
        ],
      );

      const exercise2 = createExerciseWithSets(
        'exercise-1',
        'Squat',
        3,
        10,
        90,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 90, completed: true },
          { setNumber: 2, repsPerformed: 10, weightUsed: 90, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 90, completed: true },
        ],
      );

      const exercise3 = createExerciseWithSets(
        'exercise-1',
        'Squat',
        3,
        10,
        95,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 95, completed: true },
          { setNumber: 2, repsPerformed: 10, weightUsed: 95, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 95, completed: true },
        ],
      );

      // Repository returns sessions ordered by startedAt ASC
      const session1 = createFinishedSession(
        'session-1',
        'user-1',
        'routine-1',
        [exercise1],
        new Date('2026-04-10T10:00:00Z'),
        new Date('2026-04-10T11:00:00Z'),
      );

      const session2 = createFinishedSession(
        'session-2',
        'user-1',
        'routine-1',
        [exercise2],
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      const session3 = createFinishedSession(
        'session-3',
        'user-1',
        'routine-1',
        [exercise3],
        new Date('2026-04-30T10:00:00Z'),
        new Date('2026-04-30T11:00:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([session1, session2, session3]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-1',
      });

      expect(result.sufficientData).toBe(true);
      expect(result.records).toHaveLength(3);
      // Records should be in chronological order (oldest first)
      expect(result.records[0].sessionId).toBe('session-1');
      expect(result.records[1].sessionId).toBe('session-2');
      expect(result.records[2].sessionId).toBe('session-3');
      // Verify dates are ascending
      expect(result.records[0].date.getTime()).toBeLessThan(
        result.records[1].date.getTime(),
      );
      expect(result.records[1].date.getTime()).toBeLessThan(
        result.records[2].date.getTime(),
      );
    });

    it('should compute weightUsed as max weight across completed sets', async () => {
      const exercise = createExerciseWithSets(
        'exercise-1',
        'Bench Press',
        3,
        10,
        50,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 50, completed: true },
          { setNumber: 2, repsPerformed: 8, weightUsed: 60, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 55, completed: true },
        ],
      );

      const session1 = createFinishedSession(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      const session2 = createFinishedSession(
        'session-2',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-25T10:00:00Z'),
        new Date('2026-04-25T11:00:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([session1, session2]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-1',
      });

      // Max weight across completed sets: max(50, 60, 55) = 60
      expect(result.records[0].weightUsed).toBe(60);
    });

    it('should compute repsPerformed as total reps across completed sets', async () => {
      const exercise = createExerciseWithSets(
        'exercise-1',
        'Bench Press',
        3,
        10,
        50,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 50, completed: true },
          { setNumber: 2, repsPerformed: 8, weightUsed: 55, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 50, completed: true },
        ],
      );

      const session1 = createFinishedSession(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      const session2 = createFinishedSession(
        'session-2',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-25T10:00:00Z'),
        new Date('2026-04-25T11:00:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([session1, session2]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-1',
      });

      // Total reps across completed sets: 10 + 8 + 10 = 28
      expect(result.records[0].repsPerformed).toBe(28);
    });

    it('should handle sessions with mixed completed and incomplete sets', async () => {
      const exercise = createExerciseWithSets(
        'exercise-1',
        'Bench Press',
        3,
        10,
        50,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 50, completed: true },
          { setNumber: 2, repsPerformed: 8, weightUsed: 55, completed: true },
          {
            setNumber: 3,
            repsPerformed: null,
            weightUsed: null,
            completed: false,
          },
        ],
      );

      const session1 = createFinishedSession(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      const session2 = createFinishedSession(
        'session-2',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-25T10:00:00Z'),
        new Date('2026-04-25T11:00:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([session1, session2]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-1',
      });

      expect(result.sufficientData).toBe(true);
      // Only 2 completed sets
      expect(result.records[0].setsCompleted).toBe(2);
      expect(result.records[0].totalSets).toBe(3);
      // Max weight from completed sets only: max(50, 55) = 55
      expect(result.records[0].weightUsed).toBe(55);
      // Total reps from completed sets only: 10 + 8 = 18
      expect(result.records[0].repsPerformed).toBe(18);
    });

    it('should handle sessions where the exercise appears alongside other exercises', async () => {
      const targetExercise = createExerciseWithSets(
        'exercise-1',
        'Bench Press',
        3,
        10,
        50,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 50, completed: true },
          { setNumber: 2, repsPerformed: 10, weightUsed: 50, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 50, completed: true },
        ],
      );

      const otherExercise = createExerciseWithSets(
        'exercise-2',
        'Squat',
        3,
        10,
        80,
        [
          { setNumber: 1, repsPerformed: 10, weightUsed: 80, completed: true },
          { setNumber: 2, repsPerformed: 10, weightUsed: 80, completed: true },
          { setNumber: 3, repsPerformed: 10, weightUsed: 80, completed: true },
        ],
      );

      const session1 = createFinishedSession(
        'session-1',
        'user-1',
        'routine-1',
        [targetExercise, otherExercise],
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      const session2 = createFinishedSession(
        'session-2',
        'user-1',
        'routine-1',
        [targetExercise],
        new Date('2026-04-25T10:00:00Z'),
        new Date('2026-04-25T11:00:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([session1, session2]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-1',
      });

      expect(result.sufficientData).toBe(true);
      expect(result.exerciseName).toBe('Bench Press');
      expect(result.records).toHaveLength(2);
      // Only target exercise data, not the other exercise
      expect(result.records[0].weightUsed).toBe(50);
      expect(result.records[0].repsPerformed).toBe(30);
    });

    it('should return weightUsed 0 and repsPerformed 0 when no sets are completed', async () => {
      const exercise = createExerciseWithSets(
        'exercise-1',
        'Bench Press',
        3,
        10,
        50,
        [
          {
            setNumber: 1,
            repsPerformed: null,
            weightUsed: null,
            completed: false,
          },
          {
            setNumber: 2,
            repsPerformed: null,
            weightUsed: null,
            completed: false,
          },
          {
            setNumber: 3,
            repsPerformed: null,
            weightUsed: null,
            completed: false,
          },
        ],
      );

      const session1 = createFinishedSession(
        'session-1',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-20T10:00:00Z'),
        new Date('2026-04-20T11:00:00Z'),
      );

      const session2 = createFinishedSession(
        'session-2',
        'user-1',
        'routine-1',
        [exercise],
        new Date('2026-04-25T10:00:00Z'),
        new Date('2026-04-25T11:00:00Z'),
      );

      (
        workoutSessionRepository.findFinishedByUserIdAndExerciseId as jest.Mock
      ).mockResolvedValue([session1, session2]);

      const result = await useCase.execute(actor, {
        exerciseId: 'exercise-1',
      });

      expect(result.sufficientData).toBe(true);
      expect(result.records[0].weightUsed).toBe(0);
      expect(result.records[0].repsPerformed).toBe(0);
      expect(result.records[0].setsCompleted).toBe(0);
      expect(result.records[0].totalSets).toBe(3);
    });
  });
});

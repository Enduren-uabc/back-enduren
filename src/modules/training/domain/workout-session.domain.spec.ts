import { WorkoutSession } from './entities/workout-session.entity';
import { WorkoutSessionStatus } from './value-objects/workout-session-status.value-object';
import { WorkoutExercise } from './value-objects/workout-exercise.value-object';
import { WorkoutSet } from './value-objects/workout-set.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from './errors/workout-session-domain.error';

describe('WorkoutSession domain entity', () => {
  const validUserId = 'user-1';
  const validRoutineId = 'routine-1';
  const validExercise = WorkoutExercise.create(
    'exercise-1',
    'Bench Press',
    1,
    3,
    10,
    50,
  );

  describe('create', () => {
    it('should create a session in IN_PROGRESS state', () => {
      const session = WorkoutSession.create(
        'session-1',
        validUserId,
        validRoutineId,
        [validExercise],
      );

      expect(session.id).toBe('session-1');
      expect(session.userId).toBe(validUserId);
      expect(session.routineId).toBe(validRoutineId);
      expect(session.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
      expect(session.exercises).toHaveLength(1);
      expect(session.startedAt).toBeInstanceOf(Date);
      expect(session.finishedAt).toBeNull();
    });

    it('should require a userId', () => {
      expect(() =>
        WorkoutSession.create('session-1', '', validRoutineId, [validExercise]),
      ).toThrow(WorkoutSessionDomainError);

      try {
        WorkoutSession.create('session-1', '', validRoutineId, [validExercise]);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        );
      }
    });

    it('should require a routineId', () => {
      expect(() =>
        WorkoutSession.create('session-1', validUserId, '', [validExercise]),
      ).toThrow(WorkoutSessionDomainError);

      try {
        WorkoutSession.create('session-1', validUserId, '', [validExercise]);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        );
      }
    });

    it('should create a session with exercises loaded from routine', () => {
      const exercise2 = WorkoutExercise.create(
        'exercise-2',
        'Squat',
        2,
        4,
        8,
        80,
      );

      const session = WorkoutSession.create(
        'session-1',
        validUserId,
        validRoutineId,
        [validExercise, exercise2],
      );

      expect(session.exercises).toHaveLength(2);
      expect(session.exercises[0].exerciseId).toBe('exercise-1');
      expect(session.exercises[1].exerciseId).toBe('exercise-2');
    });

    it('should create a session with empty exercises array', () => {
      const session = WorkoutSession.create(
        'session-1',
        validUserId,
        validRoutineId,
        [],
      );

      expect(session.exercises).toHaveLength(0);
    });
  });

  describe('finish', () => {
    it('should transition from IN_PROGRESS to FINISHED', () => {
      const session = WorkoutSession.create(
        'session-1',
        validUserId,
        validRoutineId,
        [validExercise],
      );

      const finished = session.finish();

      expect(finished.status).toBe(WorkoutSessionStatus.FINISHED);
      expect(finished.finishedAt).toBeInstanceOf(Date);
      expect(finished.id).toBe(session.id);
      expect(finished.userId).toBe(session.userId);
      expect(finished.routineId).toBe(session.routineId);
      expect(finished.exercises).toHaveLength(1);
    });

    it('should throw when finishing an already finished session', () => {
      const session = WorkoutSession.create(
        'session-1',
        validUserId,
        validRoutineId,
        [validExercise],
      );
      const finished = session.finish();

      expect(() => finished.finish()).toThrow(WorkoutSessionDomainError);

      try {
        finished.finish();
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        );
      }
    });

    it('should preserve exercises after finishing', () => {
      const session = WorkoutSession.create(
        'session-1',
        validUserId,
        validRoutineId,
        [validExercise],
      );
      const finished = session.finish();

      expect(finished.exercises[0].exerciseId).toBe('exercise-1');
      expect(finished.exercises[0].exerciseName).toBe('Bench Press');
    });
  });

  describe('state checks', () => {
    it('isInProgress should return true for IN_PROGRESS session', () => {
      const session = WorkoutSession.create(
        'session-1',
        validUserId,
        validRoutineId,
        [validExercise],
      );
      expect(session.isInProgress()).toBe(true);
      expect(session.isFinished()).toBe(false);
    });

    it('isFinished should return true for FINISHED session', () => {
      const session = WorkoutSession.create(
        'session-1',
        validUserId,
        validRoutineId,
        [validExercise],
      );
      const finished = session.finish();
      expect(finished.isInProgress()).toBe(false);
      expect(finished.isFinished()).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a session from persistence', () => {
      const startedAt = new Date('2026-01-01T10:00:00Z');
      const finishedAt = new Date('2026-01-01T11:00:00Z');
      const session = WorkoutSession.reconstitute(
        'session-1',
        validUserId,
        validRoutineId,
        WorkoutSessionStatus.FINISHED,
        [validExercise],
        startedAt,
        finishedAt,
      );

      expect(session.id).toBe('session-1');
      expect(session.status).toBe(WorkoutSessionStatus.FINISHED);
      expect(session.startedAt).toBe(startedAt);
      expect(session.finishedAt).toBe(finishedAt);
    });
  });
});

describe('WorkoutExercise value object', () => {
  describe('create', () => {
    it('should create a WorkoutExercise with valid data', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        3,
        10,
        50,
      );

      expect(exercise.exerciseId).toBe('exercise-1');
      expect(exercise.exerciseName).toBe('Bench Press');
      expect(exercise.order).toBe(1);
      expect(exercise.sets).toBe(3);
      expect(exercise.repsPerSet).toBe(10);
      expect(exercise.weight).toBe(50);
      expect(exercise.workoutSets).toHaveLength(3);
    });

    it('should generate WorkoutSet entries for each set', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        3,
        10,
        50,
      );

      expect(exercise.workoutSets).toHaveLength(3);
      expect(exercise.workoutSets[0].setNumber).toBe(1);
      expect(exercise.workoutSets[1].setNumber).toBe(2);
      expect(exercise.workoutSets[2].setNumber).toBe(3);
      expect(exercise.workoutSets[0].completed).toBe(false);
      expect(exercise.workoutSets[0].repsPerformed).toBeNull();
      expect(exercise.workoutSets[0].weightUsed).toBeNull();
    });

    it('should reject empty exerciseId', () => {
      expect(() =>
        WorkoutExercise.create('', 'Bench Press', 1, 3, 10, 50),
      ).toThrow();
    });

    it('should reject empty exerciseName', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', '', 1, 3, 10, 50),
      ).toThrow();
    });

    it('should reject invalid order', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 0, 3, 10, 50),
      ).toThrow();
    });

    it('should reject sets out of range', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 1, 0, 10, 50),
      ).toThrow();
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 1, 11, 10, 50),
      ).toThrow();
    });

    it('should reject repsPerSet out of range', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 1, 3, 0, 50),
      ).toThrow();
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 1, 3, 51, 50),
      ).toThrow();
    });

    it('should reject negative weight', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 1, 3, 10, -1),
      ).toThrow();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const sets = [
        WorkoutSet.reconstitute(1, 10, 50, true),
        WorkoutSet.reconstitute(2, 8, 50, false),
      ];
      const exercise = WorkoutExercise.reconstitute(
        'exercise-1',
        'Bench Press',
        1,
        3,
        10,
        50,
        sets,
      );

      expect(exercise.exerciseId).toBe('exercise-1');
      expect(exercise.workoutSets).toHaveLength(2);
      expect(exercise.workoutSets[0].completed).toBe(true);
      expect(exercise.workoutSets[1].completed).toBe(false);
    });
  });
});

describe('WorkoutSet value object', () => {
  describe('create', () => {
    it('should create a WorkoutSet with default values', () => {
      const set = WorkoutSet.create(1);

      expect(set.setNumber).toBe(1);
      expect(set.repsPerformed).toBeNull();
      expect(set.weightUsed).toBeNull();
      expect(set.completed).toBe(false);
    });

    it('should reject non-positive setNumber', () => {
      expect(() => WorkoutSet.create(0)).toThrow();
      expect(() => WorkoutSet.create(-1)).toThrow();
    });

    it('should reject non-integer setNumber', () => {
      expect(() => WorkoutSet.create(1.5)).toThrow();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persistence', () => {
      const set = WorkoutSet.reconstitute(1, 10, 50, true);

      expect(set.setNumber).toBe(1);
      expect(set.repsPerformed).toBe(10);
      expect(set.weightUsed).toBe(50);
      expect(set.completed).toBe(true);
    });
  });
});

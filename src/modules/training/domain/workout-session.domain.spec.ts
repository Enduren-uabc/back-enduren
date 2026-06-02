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
  const validExercise = WorkoutExercise.create('exercise-1', 'Bench Press', 1, [
    { setNumber: 1, reps: 10, weight: 50 },
    { setNumber: 2, reps: 10, weight: 50 },
    { setNumber: 3, reps: 10, weight: 50 },
  ]);

  describe('create', () => {
    it('should create a session in IN_PROGRESS state', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });

      expect(session.id).toBe('session-1');
      expect(session.userId).toBe(validUserId);
      expect(session.routineId).toBe(validRoutineId);
      expect(session.status).toBe(WorkoutSessionStatus.IN_PROGRESS);
      expect(session.exercises).toHaveLength(1);
      expect(session.startedAt).toBeInstanceOf(Date);
      expect(session.finishedAt).toBeNull();
      expect(session.currentExerciseIndex).toBe(0);
    });

    it('should require a userId', () => {
      expect(() =>
        WorkoutSession.create({ id: 'session-1', userId: '', routineId: validRoutineId, exercises: [validExercise] }),
      ).toThrow(WorkoutSessionDomainError);

      try {
        WorkoutSession.create({ id: 'session-1', userId: '', routineId: validRoutineId, exercises: [validExercise] });
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        });
      }
    });

    it('should require a routineId', () => {
      expect(() =>
        WorkoutSession.create({ id: 'session-1', userId: validUserId, routineId: '', exercises: [validExercise] }),
      ).toThrow(WorkoutSessionDomainError);

      try {
        WorkoutSession.create({ id: 'session-1', userId: validUserId, routineId: '', exercises: [validExercise] });
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        });
      }
    });

    it('should create a session with exercises loaded from routine', () => {
      const exercise2 = WorkoutExercise.create('exercise-2', 'Squat', 2, [
        { setNumber: 1, reps: 8, weight: 80 },
        { setNumber: 2, reps: 8, weight: 80 },
        { setNumber: 3, reps: 8, weight: 80 },
        { setNumber: 4, reps: 8, weight: 80 },
      ]);

      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise, exercise2],
      });

      expect(session.exercises).toHaveLength(2);
      expect(session.exercises[0].exerciseId).toBe('exercise-1');
      expect(session.exercises[1].exerciseId).toBe('exercise-2');
    });

    it('should create a session with empty exercises array', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [],
      });

      expect(session.exercises).toHaveLength(0);
    });
  });

  describe('finish', () => {
    it('should transition from IN_PROGRESS to FINISHED', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });

      const finished = session.finish();

      expect(finished.status).toBe(WorkoutSessionStatus.FINISHED);
      expect(finished.finishedAt).toBeInstanceOf(Date);
      expect(finished.id).toBe(session.id);
      expect(finished.userId).toBe(session.userId);
      expect(finished.routineId).toBe(session.routineId);
      expect(finished.exercises).toHaveLength(1);
    });

    it('should throw when finishing an already finished session', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });
      const finished = session.finish();

      expect(() => finished.finish()).toThrow(WorkoutSessionDomainError);

      try {
        finished.finish();
      } catch (error) {
        expect(error).toBeInstanceOf(WorkoutSessionDomainError);
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        });
      }
    });

    it('should preserve exercises after finishing', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });
      const finished = session.finish();

      expect(finished.exercises[0].exerciseId).toBe('exercise-1');
      expect(finished.exercises[0].exerciseName).toBe('Bench Press');
    });
  });

  describe('state checks', () => {
    it('isInProgress should return true for IN_PROGRESS session', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });
      expect(session.isInProgress()).toBe(true);
      expect(session.isFinished()).toBe(false);
    });

    it('isFinished should return true for FINISHED session', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });
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
        0,
        startedAt,
        finishedAt,
      });

      expect(session.id).toBe('session-1');
      expect(session.status).toBe(WorkoutSessionStatus.FINISHED);
      expect(session.startedAt).toBe(startedAt);
      expect(session.finishedAt).toBe(finishedAt);
      expect(session.currentExerciseIndex).toBe(0);
    });
  });

  describe('registerSetRepsAndWeight', () => {
    it('should register reps and weight for a set at valid exercise index', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });

      const updated = session.registerSetRepsAndWeight(0, 1, 10, 50);

      expect(updated.exercises[0].workoutSets[0].repsPerformed).toBe(10);
      expect(updated.exercises[0].workoutSets[0].weightUsed).toBe(50);
      expect(updated.exercises[0].workoutSets[0].completed).toBe(true);
    });

    it('should throw SESSION_ALREADY_FINISHED when session is finished', () => {
      let session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });
      session = session.finish();

      expect(() => session.registerSetRepsAndWeight(0, 1, 10, 50)).toThrow(
        WorkoutSessionDomainError,
      });

      try {
        session.registerSetRepsAndWeight(0, 1, 10, 50);
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        });
      }
    });

    it('should throw SESSION_EXERCISE_INDEX_INVALID when exercise index is out of range', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });

      expect(() => session.registerSetRepsAndWeight(-1, 1, 10, 50)).toThrow(
        WorkoutSessionDomainError,
      });
      expect(() => session.registerSetRepsAndWeight(5, 1, 10, 50)).toThrow(
        WorkoutSessionDomainError,
      });

      try {
        session.registerSetRepsAndWeight(5, 1, 10, 50);
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_EXERCISE_INDEX_INVALID,
        );
      }
    });

    it('should not mutate the original session', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });

      const updated = session.registerSetRepsAndWeight(0, 1, 10, 50);

      expect(session.exercises[0].workoutSets[0].repsPerformed).toBeNull();
      expect(updated.exercises[0].workoutSets[0].repsPerformed).toBe(10);
    });
  });

  describe('markSetAsCompleted', () => {
    it('should mark a set as completed after registering reps and weight', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });
      const withReps = session.registerSetRepsAndWeight(0, 1, 10, 50);
      const completed = withReps.markSetAsCompleted(0, 1);

      expect(completed.exercises[0].workoutSets[0].completed).toBe(true);
      expect(completed.exercises[0].workoutSets[0].repsPerformed).toBe(10);
      expect(completed.exercises[0].workoutSets[0].weightUsed).toBe(50);
    });

    it('should throw SESSION_ALREADY_FINISHED when session is finished', () => {
      let session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });
      session = session.finish();

      expect(() => session.markSetAsCompleted(0, 1)).toThrow(
        WorkoutSessionDomainError,
      });

      try {
        session.markSetAsCompleted(0, 1);
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        });
      }
    });

    it('should throw SESSION_EXERCISE_INDEX_INVALID with invalid exercise index', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });

      expect(() => session.markSetAsCompleted(5, 1)).toThrow(
        WorkoutSessionDomainError,
      });
    });
  });

  describe('advanceToNextExercise', () => {
    const exercise2 = WorkoutExercise.create('exercise-2', 'Squat', 2, [
      { setNumber: 1, reps: 8, weight: 80 },
      { setNumber: 2, reps: 8, weight: 80 },
      { setNumber: 3, reps: 8, weight: 80 },
    ]);

    it('should advance to next exercise when all sets are completed', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise, exercise2],
      });

      let updated = session.registerSetRepsAndWeight(0, 1, 10, 50);
      updated = updated.markSetAsCompleted(0, 1);
      updated = updated.registerSetRepsAndWeight(0, 2, 10, 50);
      updated = updated.markSetAsCompleted(0, 2);
      updated = updated.registerSetRepsAndWeight(0, 3, 10, 50);
      updated = updated.markSetAsCompleted(0, 3);

      const advanced = updated.advanceToNextExercise();

      expect(advanced.currentExerciseIndex).toBe(1);
    });

    it('should throw SESSION_EXERCISE_SETS_INCOMPLETE when sets are not all completed', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise, exercise2],
      });

      const withReps = session.registerSetRepsAndWeight(0, 1, 10, 50);

      expect(() => withReps.advanceToNextExercise()).toThrow(
        WorkoutSessionDomainError,
      });

      try {
        withReps.advanceToNextExercise();
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_EXERCISE_SETS_INCOMPLETE,
        });
      }
    });

    it('should throw SESSION_ALREADY_AT_LAST_EXERCISE when at last exercise', () => {
      const session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise],
      });

      expect(() => session.advanceToNextExercise()).toThrow(
        WorkoutSessionDomainError,
      });

      try {
        session.advanceToNextExercise();
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_AT_LAST_EXERCISE,
        });
      }
    });

    it('should throw SESSION_ALREADY_FINISHED when session is finished', () => {
      let session = WorkoutSession.create({
        id: 'session-1',
        userId: validUserId,
        routineId: validRoutineId,
        exercises: [validExercise, exercise2],
      });
      session = session.finish();

      expect(() => session.advanceToNextExercise()).toThrow(
        WorkoutSessionDomainError,
      });

      try {
        session.advanceToNextExercise();
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_ALREADY_FINISHED,
        });
      }
    });
  });
});

describe('WorkoutExercise value object', () => {
  const targetSets3 = [
    { setNumber: 1, reps: 10, weight: 50 },
    { setNumber: 2, reps: 10, weight: 50 },
    { setNumber: 3, reps: 10, weight: 50 },
  ];

  const targetSets2 = [
    { setNumber: 1, reps: 10, weight: 50 },
    { setNumber: 2, reps: 10, weight: 50 },
  ];

  describe('create', () => {
    it('should create a WorkoutExercise with valid data', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      expect(exercise.exerciseId).toBe('exercise-1');
      expect(exercise.exerciseName).toBe('Bench Press');
      expect(exercise.order).toBe(1);
      expect(exercise.targetSets).toHaveLength(3);
      expect(exercise.workoutSets).toHaveLength(3);
    });

    it('should generate WorkoutSet entries for each set', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      expect(exercise.workoutSets).toHaveLength(3);
      expect(exercise.workoutSets[0].setNumber).toBe(1);
      expect(exercise.workoutSets[1].setNumber).toBe(2);
      expect(exercise.workoutSets[2].setNumber).toBe(3);
      expect(exercise.workoutSets[0].completed).toBe(false);
      expect(exercise.workoutSets[0].repsPerformed).toBeNull();
      expect(exercise.workoutSets[0].weightUsed).toBeNull();
    });

    it('should clone targetReps and targetWeight from routine sets into workoutSets', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      expect(exercise.workoutSets[0].targetReps).toBe(10);
      expect(exercise.workoutSets[0].targetWeight).toBe(50);
      expect(exercise.workoutSets[1].targetReps).toBe(10);
      expect(exercise.workoutSets[1].targetWeight).toBe(50);
      expect(exercise.workoutSets[2].targetReps).toBe(10);
      expect(exercise.workoutSets[2].targetWeight).toBe(50);
    });

    it('should reject empty exerciseId', () => {
      expect(() =>
        WorkoutExercise.create('', 'Bench Press', 1, targetSets3),
      ).toThrow();
    });

    it('should reject empty exerciseName', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', '', 1, targetSets3),
      ).toThrow();
    });

    it('should reject invalid order', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 0, targetSets3),
      ).toThrow();
    });

    it('should reject empty targetSets', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 1, []),
      ).toThrow();
    });

    it('should reject targetSet with invalid reps', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 1, [
          { setNumber: 1, reps: 0, weight: 50 },
        ]),
      ).toThrow();
    });

    it('should reject negative weight in targetSet', () => {
      expect(() =>
        WorkoutExercise.create('exercise-1', 'Bench Press', 1, [
          { setNumber: 1, reps: 10, weight: -1 },
        ]),
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
        targetSets3,
        sets,
      );

      expect(exercise.exerciseId).toBe('exercise-1');
      expect(exercise.workoutSets).toHaveLength(2);
      expect(exercise.workoutSets[0].completed).toBe(true);
      expect(exercise.workoutSets[1].completed).toBe(false);
    });
  });

  describe('registerSetRepsAndWeight', () => {
    it('should register reps and weight for a valid set number', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      const updated = exercise.registerSetRepsAndWeight(1, 10, 50);

      expect(updated.workoutSets[0].repsPerformed).toBe(10);
      expect(updated.workoutSets[0].weightUsed).toBe(50);
      expect(updated.workoutSets[0].completed).toBe(true);
    });

    it('should throw SESSION_SET_NOT_FOUND when set number does not exist', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      expect(() => exercise.registerSetRepsAndWeight(99, 10, 50)).toThrow(
        WorkoutSessionDomainError,
      );

      try {
        exercise.registerSetRepsAndWeight(99, 10, 50);
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_SET_NOT_FOUND,
        );
      }
    });

    it('should not mutate the original exercise', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      const updated = exercise.registerSetRepsAndWeight(1, 10, 50);

      expect(exercise.workoutSets[0].repsPerformed).toBeNull();
      expect(updated.workoutSets[0].repsPerformed).toBe(10);
    });
  });

  describe('markSetAsCompleted', () => {
    it('should mark a set as completed after reps and weight are set', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      const withReps = exercise.registerSetRepsAndWeight(1, 10, 50);
      const completed = withReps.markSetAsCompleted(1);

      expect(completed.workoutSets[0].completed).toBe(true);
      expect(completed.workoutSets[0].repsPerformed).toBe(10);
      expect(completed.workoutSets[0].weightUsed).toBe(50);
    });

    it('should throw SESSION_SET_NOT_FOUND when set number does not exist', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      expect(() => exercise.markSetAsCompleted(99)).toThrow(
        WorkoutSessionDomainError,
      );

      try {
        exercise.markSetAsCompleted(99);
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_SET_NOT_FOUND,
        );
      }
    });
  });

  describe('areAllSetsCompleted', () => {
    it('should return false when no sets are completed', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      expect(exercise.areAllSetsCompleted()).toBe(false);
    });

    it('should return false when some sets are not completed', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets3,
      );

      let updated = exercise.registerSetRepsAndWeight(1, 10, 50);
      updated = updated.markSetAsCompleted(1);

      expect(updated.areAllSetsCompleted()).toBe(false);
    });

    it('should return true when all sets are completed', () => {
      const exercise = WorkoutExercise.create(
        'exercise-1',
        'Bench Press',
        1,
        targetSets2,
      );

      let updated = exercise.registerSetRepsAndWeight(1, 10, 50);
      updated = updated.markSetAsCompleted(1);
      updated = updated.registerSetRepsAndWeight(2, 8, 50);
      updated = updated.markSetAsCompleted(2);

      expect(updated.areAllSetsCompleted()).toBe(true);
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
      expect(set.targetReps).toBeNull();
      expect(set.targetWeight).toBeNull();
      expect(set.completed).toBe(false);
    });

    it('should create a WorkoutSet with targetReps and targetWeight', () => {
      const set = WorkoutSet.create(1, 10, 50);

      expect(set.setNumber).toBe(1);
      expect(set.targetReps).toBe(10);
      expect(set.targetWeight).toBe(50);
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
      expect(set.targetReps).toBeNull();
      expect(set.targetWeight).toBeNull();
    });

    it('should reconstitute from persistence with target values', () => {
      const set = WorkoutSet.reconstitute(1, 10, 50, true, 12, 55);

      expect(set.setNumber).toBe(1);
      expect(set.repsPerformed).toBe(10);
      expect(set.weightUsed).toBe(50);
      expect(set.completed).toBe(true);
      expect(set.targetReps).toBe(12);
      expect(set.targetWeight).toBe(55);
    });
  });

  describe('registerRepsAndWeight', () => {
    it('should register reps and weight for a pending set', () => {
      const set = WorkoutSet.create(1, 10, 50);
      const updated = set.registerRepsAndWeight(10, 50);

      expect(updated.repsPerformed).toBe(10);
      expect(updated.weightUsed).toBe(50);
      expect(updated.completed).toBe(true);
      expect(updated.setNumber).toBe(1);
      expect(updated.targetReps).toBe(10);
      expect(updated.targetWeight).toBe(50);
    });

    it('should throw SESSION_SET_ALREADY_COMPLETED when set is already completed', () => {
      const set = WorkoutSet.create(1);
      const withReps = set.registerRepsAndWeight(10, 50);
      const completed = withReps.markAsCompleted();

      expect(() => completed.registerRepsAndWeight(12, 55)).toThrow(
        WorkoutSessionDomainError,
      );

      try {
        completed.registerRepsAndWeight(12, 55);
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_SET_ALREADY_COMPLETED,
        );
      }
    });

    it('should throw SESSION_SET_MISSING_REQUIRED_DATA for non-positive repsPerformed', () => {
      const set = WorkoutSet.create(1);

      expect(() => set.registerRepsAndWeight(0, 50)).toThrow(
        WorkoutSessionDomainError,
      );
      expect(() => set.registerRepsAndWeight(-1, 50)).toThrow(
        WorkoutSessionDomainError,
      );

      try {
        set.registerRepsAndWeight(0, 50);
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_SET_MISSING_REQUIRED_DATA,
        );
      }
    });

    it('should throw SESSION_SET_MISSING_REQUIRED_DATA for negative weightUsed', () => {
      const set = WorkoutSet.create(1);

      expect(() => set.registerRepsAndWeight(10, -1)).toThrow(
        WorkoutSessionDomainError,
      );

      try {
        set.registerRepsAndWeight(10, -1);
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_SET_MISSING_REQUIRED_DATA,
        );
      }
    });

    it('should allow weightUsed of zero', () => {
      const set = WorkoutSet.create(1);
      const updated = set.registerRepsAndWeight(10, 0);

      expect(updated.weightUsed).toBe(0);
    });

    it('should not mutate the original set', () => {
      const set = WorkoutSet.create(1);
      const updated = set.registerRepsAndWeight(10, 50);

      expect(set.repsPerformed).toBeNull();
      expect(updated.repsPerformed).toBe(10);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark a set as completed when reps and weight are set', () => {
      const set = WorkoutSet.create(1, 12, 55);
      const withReps = set.registerRepsAndWeight(10, 50);
      const completed = withReps.markAsCompleted();

      expect(completed.completed).toBe(true);
      expect(completed.repsPerformed).toBe(10);
      expect(completed.weightUsed).toBe(50);
      expect(completed.targetReps).toBe(12);
      expect(completed.targetWeight).toBe(55);
    });

    it('should throw SESSION_SET_MISSING_REQUIRED_DATA when reps are not set', () => {
      const set = WorkoutSet.create(1);

      expect(() => set.markAsCompleted()).toThrow(WorkoutSessionDomainError);

      try {
        set.markAsCompleted();
      } catch (error) {
        expect((error as WorkoutSessionDomainError).code).toBe(
          WorkoutSessionErrorCode.SESSION_SET_MISSING_REQUIRED_DATA,
        );
      }
    });

    it('should not mutate the original set', () => {
      const set = WorkoutSet.create(1);
      const withReps = set.registerRepsAndWeight(10, 50);
      const completed = withReps.markAsCompleted();

      expect(withReps.completed).toBe(true);
      expect(completed.completed).toBe(true);
    });
  });
});

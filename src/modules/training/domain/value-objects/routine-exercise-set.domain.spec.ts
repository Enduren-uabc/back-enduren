import { RoutineExerciseSet } from './routine-exercise-set.value-object';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../errors/routine-domain.error';
import { Exercise } from '../entities/exercise.entity';

describe('RoutineExerciseSet Value Object', () => {
  describe('create', () => {
    it('should create a valid set with minimum values', () => {
      const set = RoutineExerciseSet.create(1, 1, 0);
      expect(set.setNumber).toBe(1);
      expect(set.reps).toBe(1);
      expect(set.weight).toBe(0);
      expect(set.restSeconds).toBeNull();
    });

    it('should create a valid set with typical values', () => {
      const set = RoutineExerciseSet.create(1, 12, 50.5);
      expect(set.setNumber).toBe(1);
      expect(set.reps).toBe(12);
      expect(set.weight).toBe(50.5);
    });

    it('should create a valid set with restSeconds', () => {
      const set = RoutineExerciseSet.create(1, 10, 60, 90);
      expect(set.restSeconds).toBe(90);
    });

    it('should reject setNumber = 0', () => {
      expect(() => RoutineExerciseSet.create(0, 10, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject negative setNumber', () => {
      expect(() => RoutineExerciseSet.create(-1, 10, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject non-integer setNumber', () => {
      expect(() => RoutineExerciseSet.create(1.5, 10, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject reps = 0', () => {
      expect(() => RoutineExerciseSet.create(1, 0, 50)).toThrow(
        RoutineDomainError,
      );
      try {
        RoutineExerciseSet.create(1, 0, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_REPS_OUT_OF_RANGE,
        );
      }
    });

    it('should reject negative reps', () => {
      expect(() => RoutineExerciseSet.create(1, -5, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject non-integer reps', () => {
      expect(() => RoutineExerciseSet.create(1, 10.5, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject negative weight', () => {
      expect(() => RoutineExerciseSet.create(1, 10, -1)).toThrow(
        RoutineDomainError,
      );
      try {
        RoutineExerciseSet.create(1, 10, -1);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_WEIGHT_INVALID,
        );
      }
    });

    it('should allow weight = 0', () => {
      const set = RoutineExerciseSet.create(1, 10, 0);
      expect(set.weight).toBe(0);
    });

    it('should allow fractional weight', () => {
      const set = RoutineExerciseSet.create(1, 10, 2.5);
      expect(set.weight).toBe(2.5);
    });

    it('should reject negative restSeconds', () => {
      expect(() => RoutineExerciseSet.create(1, 10, 50, -1)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject non-integer restSeconds', () => {
      expect(() => RoutineExerciseSet.create(1, 10, 50, 1.5)).toThrow(
        RoutineDomainError,
      );
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a set from persistence', () => {
      const set = RoutineExerciseSet.reconstitute('set-1', 2, 8, 80, 60);
      expect(set.id).toBe('set-1');
      expect(set.setNumber).toBe(2);
      expect(set.reps).toBe(8);
      expect(set.weight).toBe(80);
      expect(set.restSeconds).toBe(60);
    });
  });

  describe('equals', () => {
    it('should return true for equal sets', () => {
      const a = RoutineExerciseSet.create(1, 10, 50);
      const b = RoutineExerciseSet.create(1, 10, 50);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different sets', () => {
      const a = RoutineExerciseSet.create(1, 10, 50);
      const b = RoutineExerciseSet.create(2, 10, 50);
      expect(a.equals(b)).toBe(false);
    });
  });
});

describe('Exercise Entity - configureSets()', () => {
  describe('configureSets', () => {
    it('should return a new Exercise with sets applied (immutable pattern)', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      expect(exercise.sets).toHaveLength(0);

      const sets = [
        RoutineExerciseSet.create(1, 12, 50),
        RoutineExerciseSet.create(2, 12, 50),
        RoutineExerciseSet.create(3, 10, 45),
      ];
      const configured = exercise.configureSets(sets);
      expect(configured.sets).toHaveLength(3);
      expect(configured.sets[0].setNumber).toBe(1);
      expect(configured.sets[0].reps).toBe(12);
      expect(configured.sets[0].weight).toBe(50);
      expect(configured.sets[2].reps).toBe(10);

      // Original exercise is unchanged
      expect(exercise.sets).toHaveLength(0);
      expect(exercise.id).toBe('ex-1');
      expect(exercise.name).toBe('Push-ups');
    });

    it('should preserve id, name and order when configuring', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      const configured = exercise.configureSets([
        RoutineExerciseSet.create(1, 10, 100),
      ]);
      expect(configured.id).toBe('ex-1');
      expect(configured.name).toBe('Push-ups');
      expect(configured.order).toBe(0);
    });

    it('should reject empty sets array', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      expect(() => exercise.configureSets([])).toThrow(RoutineDomainError);
    });

    it('should allow re-configuration of an already configured exercise', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      const configured = exercise.configureSets([
        RoutineExerciseSet.create(1, 12, 50),
        RoutineExerciseSet.create(2, 12, 50),
      ]);
      const reconfigured = configured.configureSets([
        RoutineExerciseSet.create(1, 8, 60),
        RoutineExerciseSet.create(2, 8, 60),
        RoutineExerciseSet.create(3, 6, 70),
      ]);
      expect(reconfigured.sets).toHaveLength(3);
      expect(reconfigured.sets[0].reps).toBe(8);
      // Previous configuration is unchanged
      expect(configured.sets).toHaveLength(2);
      expect(configured.sets[0].reps).toBe(12);
    });
  });

  describe('reconstitute with sets', () => {
    it('should reconstitute an exercise with sets from persistence', () => {
      const sets = [
        RoutineExerciseSet.reconstitute('s-1', 1, 12, 50, null),
        RoutineExerciseSet.reconstitute('s-2', 2, 10, 45, 60),
      ];
      const exercise = Exercise.reconstitute('ex-1', 'Push-ups', 0, sets);
      expect(exercise.sets).toHaveLength(2);
      expect(exercise.sets[0].reps).toBe(12);
      expect(exercise.sets[1].restSeconds).toBe(60);
    });

    it('should reconstitute an exercise without sets from persistence', () => {
      const exercise = Exercise.reconstitute('ex-1', 'Push-ups', 0);
      expect(exercise.sets).toHaveLength(0);
    });
  });
});

import { Exercise } from './entities/exercise.entity';
import { ExerciseConfiguration } from './value-objects/exercise-configuration.value-object';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from './errors/routine-domain.error';

describe('ExerciseConfiguration Value Object', () => {
  describe('create', () => {
    it('should create a valid configuration with minimum values (RF-11.0.1, RF-11.0.2, RF-11.0.3)', () => {
      const config = ExerciseConfiguration.create(1, 1, 0);
      expect(config.sets).toBe(1);
      expect(config.repsPerSet).toBe(1);
      expect(config.weight).toBe(0);
    });

    it('should create a valid configuration with maximum values (RF-11.0.1, RF-11.0.2, RF-11.0.3)', () => {
      const config = ExerciseConfiguration.create(10, 50, 999.99);
      expect(config.sets).toBe(10);
      expect(config.repsPerSet).toBe(50);
      expect(config.weight).toBe(999.99);
    });

    it('should create a valid configuration with typical values', () => {
      const config = ExerciseConfiguration.create(3, 12, 50.5);
      expect(config.sets).toBe(3);
      expect(config.repsPerSet).toBe(12);
      expect(config.weight).toBe(50.5);
    });

    it('should reject sets = 0 (RF-11.0.1)', () => {
      expect(() => ExerciseConfiguration.create(0, 10, 50)).toThrow(
        RoutineDomainError,
      );
      try {
        ExerciseConfiguration.create(0, 10, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(
          RoutineErrorCode.EXERCISE_SETS_OUT_OF_RANGE,
        );
      }
    });

    it('should reject sets > 10 (RF-11.0.1)', () => {
      expect(() => ExerciseConfiguration.create(11, 10, 50)).toThrow(
        RoutineDomainError,
      );
      try {
        ExerciseConfiguration.create(11, 10, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(
          RoutineErrorCode.EXERCISE_SETS_OUT_OF_RANGE,
        );
      }
    });

    it('should reject negative sets (RF-11.0.1)', () => {
      expect(() => ExerciseConfiguration.create(-1, 10, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject non-integer sets (RF-11.0.1)', () => {
      expect(() => ExerciseConfiguration.create(3.5, 10, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject repsPerSet = 0 (RF-11.0.2)', () => {
      expect(() => ExerciseConfiguration.create(3, 0, 50)).toThrow(
        RoutineDomainError,
      );
      try {
        ExerciseConfiguration.create(3, 0, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(
          RoutineErrorCode.EXERCISE_REPS_OUT_OF_RANGE,
        );
      }
    });

    it('should reject repsPerSet > 50 (RF-11.0.2)', () => {
      expect(() => ExerciseConfiguration.create(3, 51, 50)).toThrow(
        RoutineDomainError,
      );
      try {
        ExerciseConfiguration.create(3, 51, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(
          RoutineErrorCode.EXERCISE_REPS_OUT_OF_RANGE,
        );
      }
    });

    it('should reject negative repsPerSet (RF-11.0.2)', () => {
      expect(() => ExerciseConfiguration.create(3, -5, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject non-integer repsPerSet (RF-11.0.2)', () => {
      expect(() => ExerciseConfiguration.create(3, 10.5, 50)).toThrow(
        RoutineDomainError,
      );
    });

    it('should reject negative weight (RF-11.0.3)', () => {
      expect(() => ExerciseConfiguration.create(3, 10, -1)).toThrow(
        RoutineDomainError,
      );
      try {
        ExerciseConfiguration.create(3, 10, -1);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.EXERCISE_WEIGHT_INVALID);
      }
    });

    it('should allow weight = 0 (RF-11.0.3)', () => {
      const config = ExerciseConfiguration.create(3, 10, 0);
      expect(config.weight).toBe(0);
    });

    it('should allow fractional weight (RF-11.0.3)', () => {
      const config = ExerciseConfiguration.create(3, 10, 2.5);
      expect(config.weight).toBe(2.5);
    });

    it('should reject combined invalid values: sets out of range and reps out of range (RF-11.0.4)', () => {
      // Should throw on the first invalid value encountered (sets)
      expect(() => ExerciseConfiguration.create(0, 0, -1)).toThrow(
        RoutineDomainError,
      );
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a configuration from persistence', () => {
      const config = ExerciseConfiguration.reconstitute(3, 12, 50.5);
      expect(config.sets).toBe(3);
      expect(config.repsPerSet).toBe(12);
      expect(config.weight).toBe(50.5);
    });
  });

  describe('equals', () => {
    it('should return true for equal configurations', () => {
      const a = ExerciseConfiguration.create(3, 12, 50);
      const b = ExerciseConfiguration.create(3, 12, 50);
      expect(a.equals(b)).toBe(true);
    });

    it('should return false for different configurations', () => {
      const a = ExerciseConfiguration.create(3, 12, 50);
      const b = ExerciseConfiguration.create(4, 12, 50);
      expect(a.equals(b)).toBe(false);
    });
  });
});

describe('Exercise Entity - configure()', () => {
  describe('configure', () => {
    it('should return a new Exercise with configuration applied (immutable pattern)', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      expect(exercise.configuration).toBeNull();

      const configured = exercise.configure(3, 12, 50);
      expect(configured.configuration).not.toBeNull();
      expect(configured.configuration!.sets).toBe(3);
      expect(configured.configuration!.repsPerSet).toBe(12);
      expect(configured.configuration!.weight).toBe(50);

      // Original exercise is unchanged
      expect(exercise.configuration).toBeNull();
      expect(exercise.id).toBe('ex-1');
      expect(exercise.name).toBe('Push-ups');
    });

    it('should preserve id, name and order when configuring', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      const configured = exercise.configure(5, 10, 100);
      expect(configured.id).toBe('ex-1');
      expect(configured.name).toBe('Push-ups');
      expect(configured.order).toBe(0);
    });

    it('should reject invalid sets via configure (RF-11.0.1)', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      expect(() => exercise.configure(0, 10, 50)).toThrow(RoutineDomainError);
    });

    it('should reject invalid repsPerSet via configure (RF-11.0.2)', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      expect(() => exercise.configure(3, 0, 50)).toThrow(RoutineDomainError);
    });

    it('should reject negative weight via configure (RF-11.0.3)', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      expect(() => exercise.configure(3, 10, -5)).toThrow(RoutineDomainError);
    });

    it('should allow re-configuration of an already configured exercise', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      const configured = exercise.configure(3, 12, 50);
      const reconfigured = configured.configure(5, 8, 60);
      expect(reconfigured.configuration!.sets).toBe(5);
      expect(reconfigured.configuration!.repsPerSet).toBe(8);
      expect(reconfigured.configuration!.weight).toBe(60);
      // Previous configuration is unchanged
      expect(configured.configuration!.sets).toBe(3);
    });
  });

  describe('reconstitute with configuration', () => {
    it('should reconstitute an exercise with configuration from persistence', () => {
      const config = ExerciseConfiguration.reconstitute(3, 12, 50);
      const exercise = Exercise.reconstitute('ex-1', 'Push-ups', 0, config);
      expect(exercise.configuration).not.toBeNull();
      expect(exercise.configuration!.sets).toBe(3);
      expect(exercise.configuration!.repsPerSet).toBe(12);
      expect(exercise.configuration!.weight).toBe(50);
    });

    it('should reconstitute an exercise without configuration from persistence', () => {
      const exercise = Exercise.reconstitute('ex-1', 'Push-ups', 0);
      expect(exercise.configuration).toBeNull();
    });
  });
});

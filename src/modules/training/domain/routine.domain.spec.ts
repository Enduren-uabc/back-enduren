import { Routine } from './entities/routine.entity';
import { RoutineDay } from './value-objects/routine-day.value-object';
import { Exercise } from './entities/exercise.entity';
import { ExerciseConfiguration } from './value-objects/exercise-configuration.value-object';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from './errors/routine-domain.error';

describe('RoutineDay Value Object', () => {
  describe('create', () => {
    it('should create a valid RoutineDay with a valid day of week', () => {
      const day = RoutineDay.create('monday');
      expect(day.dayOfWeek).toBe('monday');
      expect(day.exerciseCount).toBe(0);
      expect(day.exercises).toHaveLength(0);
    });

    it('should create RoutineDay for each valid day of week', () => {
      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      days.forEach((dow) => {
        const day = RoutineDay.create(dow);
        expect(day.dayOfWeek).toBe(dow);
      });
    });

    it('should reject an invalid day of week', () => {
      expect(() => RoutineDay.create('invalidday')).toThrow(RoutineDomainError);
      try {
        RoutineDay.create('invalidday');
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(
          RoutineErrorCode.ROUTINE_DAY_INVALID_DAY_OF_WEEK,
        );
      }
    });

    it('should reject an empty string as day of week', () => {
      expect(() => RoutineDay.create('')).toThrow(RoutineDomainError);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a RoutineDay from persistence with exercises', () => {
      const exercises = [
        Exercise.reconstitute('ex-1', 'Push-ups', 0),
        Exercise.reconstitute('ex-2', 'Squats', 1),
      ];
      const day = RoutineDay.reconstitute('monday', exercises);
      expect(day.dayOfWeek).toBe('monday');
      expect(day.exerciseCount).toBe(2);
      expect(day.exercises).toHaveLength(2);
    });
  });

  describe('addExercise', () => {
    it('should add an exercise to a day', () => {
      const day = RoutineDay.create('monday');
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      const updated = day.addExercise(exercise);
      expect(updated.exercises).toHaveLength(1);
      expect(updated.exercises[0].name).toBe('Push-ups');
      expect(updated.exerciseCount).toBe(1);
    });

    it('should not mutate the original day', () => {
      const day = RoutineDay.create('monday');
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      day.addExercise(exercise);
      expect(day.exercises).toHaveLength(0);
    });

    it('should reject adding exercise when day has 10 exercises (RF-10.0.4, RF-10.0.5)', () => {
      const exercises = Array.from({ length: 10 }, (_, i) =>
        Exercise.reconstitute(`ex-${i}`, `Exercise ${i}`, i),
      );
      const day = RoutineDay.reconstitute('monday', exercises);
      const newExercise = Exercise.create('ex-11', 'Extra Exercise', 10);

      expect(() => day.addExercise(newExercise)).toThrow(RoutineDomainError);
      try {
        day.addExercise(newExercise);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(
          RoutineErrorCode.EXERCISE_DAY_LIMIT_EXCEEDED,
        );
      }
    });

    it('should allow adding exercise when day has 9 exercises', () => {
      const exercises = Array.from({ length: 9 }, (_, i) =>
        Exercise.reconstitute(`ex-${i}`, `Exercise ${i}`, i),
      );
      const day = RoutineDay.reconstitute('monday', exercises);
      const newExercise = Exercise.create('ex-10', 'Tenth Exercise', 9);
      const updated = day.addExercise(newExercise);
      expect(updated.exercises).toHaveLength(10);
    });
  });

  describe('removeExercise', () => {
    it('should remove an exercise from a day', () => {
      const exercises = [
        Exercise.reconstitute('ex-1', 'Push-ups', 0),
        Exercise.reconstitute('ex-2', 'Squats', 1),
      ];
      const day = RoutineDay.reconstitute('monday', exercises);
      const updated = day.removeExercise('ex-1');
      expect(updated.exercises).toHaveLength(1);
      expect(updated.exercises[0].id).toBe('ex-2');
    });

    it('should throw when removing a non-existent exercise (RF-10.0.6)', () => {
      const day = RoutineDay.create('monday');
      expect(() => day.removeExercise('nonexistent')).toThrow(
        RoutineDomainError,
      );
      try {
        day.removeExercise('nonexistent');
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.EXERCISE_NOT_FOUND);
      }
    });

    it('should not mutate the original day', () => {
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
      const day = RoutineDay.reconstitute('monday', exercises);
      day.removeExercise('ex-1');
      expect(day.exercises).toHaveLength(1);
    });
  });

  describe('equals', () => {
    it('should return true for same day of week', () => {
      const day1 = RoutineDay.create('monday');
      const day2 = RoutineDay.create('monday');
      expect(day1.equals(day2)).toBe(true);
    });

    it('should return false for different day of week', () => {
      const day1 = RoutineDay.create('monday');
      const day2 = RoutineDay.create('tuesday');
      expect(day1.equals(day2)).toBe(false);
    });
  });
});

describe('Exercise Entity', () => {
  describe('create', () => {
    it('should create an exercise with valid data', () => {
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      expect(exercise.id).toBe('ex-1');
      expect(exercise.name).toBe('Push-ups');
      expect(exercise.order).toBe(0);
    });

    it('should trim the exercise name', () => {
      const exercise = Exercise.create('ex-1', '  Push-ups  ', 0);
      expect(exercise.name).toBe('Push-ups');
    });

    it('should reject an empty exercise name (RF-10)', () => {
      expect(() => Exercise.create('ex-1', '', 0)).toThrow(RoutineDomainError);
      try {
        Exercise.create('ex-1', '', 0);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.EXERCISE_NAME_REQUIRED);
      }
    });

    it('should reject a whitespace-only exercise name', () => {
      expect(() => Exercise.create('ex-1', '   ', 0)).toThrow(
        RoutineDomainError,
      );
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute an exercise from persistence', () => {
      const exercise = Exercise.reconstitute('ex-1', 'Push-ups', 0);
      expect(exercise.id).toBe('ex-1');
      expect(exercise.name).toBe('Push-ups');
      expect(exercise.order).toBe(0);
    });
  });
});

describe('RoutineDay - configureExercise', () => {
  it('should configure an exercise in a day (RF-11.0.5)', () => {
    const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
    const day = RoutineDay.reconstitute('monday', exercises);
    const updated = day.configureExercise('ex-1', 3, 12, 50);
    expect(updated.exercises[0].configuration).not.toBeNull();
    expect(updated.exercises[0].configuration!.sets).toBe(3);
    expect(updated.exercises[0].configuration!.repsPerSet).toBe(12);
    expect(updated.exercises[0].configuration!.weight).toBe(50);
  });

  it('should not mutate the original day when configuring an exercise', () => {
    const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
    const day = RoutineDay.reconstitute('monday', exercises);
    day.configureExercise('ex-1', 3, 12, 50);
    expect(day.exercises[0].configuration).toBeNull();
  });

  it('should reject configuring a non-existent exercise in day', () => {
    const day = RoutineDay.create('monday');
    expect(() => day.configureExercise('nonexistent', 3, 12, 50)).toThrow(
      RoutineDomainError,
    );
    try {
      day.configureExercise('nonexistent', 3, 12, 50);
    } catch (error) {
      expect(error).toBeInstanceOf(RoutineDomainError);
      expect((error as RoutineDomainError).code).toBe(
        RoutineErrorCode.EXERCISE_NOT_FOUND,
      );
    }
  });

  it('should reject invalid sets via configureExercise (RF-11.0.1)', () => {
    const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
    const day = RoutineDay.reconstitute('monday', exercises);
    expect(() => day.configureExercise('ex-1', 0, 12, 50)).toThrow(
      RoutineDomainError,
    );
  });

  it('should reject invalid repsPerSet via configureExercise (RF-11.0.2)', () => {
    const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
    const day = RoutineDay.reconstitute('monday', exercises);
    expect(() => day.configureExercise('ex-1', 3, 0, 50)).toThrow(
      RoutineDomainError,
    );
  });

  it('should reject negative weight via configureExercise (RF-11.0.3)', () => {
    const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
    const day = RoutineDay.reconstitute('monday', exercises);
    expect(() => day.configureExercise('ex-1', 3, 12, -5)).toThrow(
      RoutineDomainError,
    );
  });
});

describe('Routine Entity', () => {
  const validDays = [RoutineDay.create('monday')];

  describe('create', () => {
    it('should create a routine with valid data', () => {
      const routine = Routine.create('id-1', 'My Routine', 'user-1', validDays);
      expect(routine.id).toBe('id-1');
      expect(routine.name).toBe('My Routine');
      expect(routine.userId).toBe('user-1');
      expect(routine.days).toHaveLength(1);
      expect(routine.days[0].dayOfWeek).toBe('monday');
    });

    it('should trim the routine name', () => {
      const routine = Routine.create(
        'id-1',
        '  My Routine  ',
        'user-1',
        validDays,
      );
      expect(routine.name).toBe('My Routine');
    });

    it('should reject an empty name', () => {
      expect(() => Routine.create('id-1', '', 'user-1', validDays)).toThrow(
        RoutineDomainError,
      );
      try {
        Routine.create('id-1', '', 'user-1', validDays);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.ROUTINE_NAME_REQUIRED);
      }
    });

    it('should reject a whitespace-only name', () => {
      expect(() => Routine.create('id-1', '   ', 'user-1', validDays)).toThrow(
        RoutineDomainError,
      );
      try {
        Routine.create('id-1', '   ', 'user-1', validDays);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.ROUTINE_NAME_REQUIRED);
      }
    });

    it('should reject zero days', () => {
      expect(() => Routine.create('id-1', 'My Routine', 'user-1', [])).toThrow(
        RoutineDomainError,
      );
      try {
        Routine.create('id-1', 'My Routine', 'user-1', []);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.ROUTINE_DAYS_MINIMUM);
      }
    });

    it('should accept multiple days', () => {
      const days = [
        RoutineDay.create('monday'),
        RoutineDay.create('wednesday'),
        RoutineDay.create('friday'),
      ];
      const routine = Routine.create('id-1', 'Full Body', 'user-1', days);
      expect(routine.days).toHaveLength(3);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a routine from persistence', () => {
      const now = new Date();
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
      const days = [RoutineDay.reconstitute('monday', exercises)];
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        days,
        now,
        now,
      );
      expect(routine.id).toBe('id-1');
      expect(routine.name).toBe('My Routine');
      expect(routine.userId).toBe('user-1');
      expect(routine.days).toHaveLength(1);
      expect(routine.days[0].exerciseCount).toBe(1);
      expect(routine.days[0].exercises[0].name).toBe('Push-ups');
    });
  });

  describe('addExerciseToDay', () => {
    it('should add an exercise to an existing day', () => {
      const days = [RoutineDay.create('monday')];
      const routine = Routine.create('id-1', 'My Routine', 'user-1', days);
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      const updated = routine.addExerciseToDay('monday', exercise);
      expect(updated.days[0].exercises).toHaveLength(1);
      expect(updated.days[0].exercises[0].name).toBe('Push-ups');
    });

    it('should reject adding exercise to a non-existent day (RF-10.0.2)', () => {
      const days = [RoutineDay.create('monday')];
      const routine = Routine.create('id-1', 'My Routine', 'user-1', days);
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      expect(() => routine.addExerciseToDay('friday', exercise)).toThrow(
        RoutineDomainError,
      );
      try {
        routine.addExerciseToDay('friday', exercise);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.EXERCISE_DAY_NOT_FOUND);
      }
    });

    it('should reject adding exercise when day has 10 exercises (RF-10.0.4, RF-10.0.5)', () => {
      const exercises = Array.from({ length: 10 }, (_, i) =>
        Exercise.reconstitute(`ex-${i}`, `Exercise ${i}`, i),
      );
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );
      const newExercise = Exercise.create('ex-11', 'Extra Exercise', 10);
      expect(() => routine.addExerciseToDay('monday', newExercise)).toThrow(
        RoutineDomainError,
      );
      try {
        routine.addExerciseToDay('monday', newExercise);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(
          RoutineErrorCode.EXERCISE_DAY_LIMIT_EXCEEDED,
        );
      }
    });

    it('should not mutate the original routine', () => {
      const days = [RoutineDay.create('monday')];
      const routine = Routine.create('id-1', 'My Routine', 'user-1', days);
      const exercise = Exercise.create('ex-1', 'Push-ups', 0);
      routine.addExerciseToDay('monday', exercise);
      expect(routine.days[0].exercises).toHaveLength(0);
    });
  });

  describe('removeExerciseFromDay', () => {
    it('should remove an exercise from a day', () => {
      const exercises = [
        Exercise.reconstitute('ex-1', 'Push-ups', 0),
        Exercise.reconstitute('ex-2', 'Squats', 1),
      ];
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );
      const updated = routine.removeExerciseFromDay('monday', 'ex-1');
      expect(updated.days[0].exercises).toHaveLength(1);
      expect(updated.days[0].exercises[0].id).toBe('ex-2');
    });

    it('should reject removing exercise from a non-existent day', () => {
      const days = [RoutineDay.create('monday')];
      const routine = Routine.create('id-1', 'My Routine', 'user-1', days);
      expect(() => routine.removeExerciseFromDay('friday', 'ex-1')).toThrow(
        RoutineDomainError,
      );
      try {
        routine.removeExerciseFromDay('friday', 'ex-1');
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.EXERCISE_DAY_NOT_FOUND);
      }
    });

    it('should reject removing a non-existent exercise (RF-10.0.6)', () => {
      const days = [RoutineDay.create('monday')];
      const routine = Routine.create('id-1', 'My Routine', 'user-1', days);
      expect(() =>
        routine.removeExerciseFromDay('monday', 'nonexistent'),
      ).toThrow(RoutineDomainError);
      try {
        routine.removeExerciseFromDay('monday', 'nonexistent');
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        const domainError = error as RoutineDomainError;
        expect(domainError.code).toBe(RoutineErrorCode.EXERCISE_NOT_FOUND);
      }
    });

    it('should not mutate the original routine', () => {
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );
      routine.removeExerciseFromDay('monday', 'ex-1');
      expect(routine.days[0].exercises).toHaveLength(1);
    });
  });

  describe('configureExercise (RF-11.0.5)', () => {
    it('should configure an exercise in a day', () => {
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );

      const updated = routine.configureExercise('monday', 'ex-1', 3, 12, 50);
      expect(updated.days[0].exercises[0].configuration).not.toBeNull();
      expect(updated.days[0].exercises[0].configuration!.sets).toBe(3);
      expect(updated.days[0].exercises[0].configuration!.repsPerSet).toBe(12);
      expect(updated.days[0].exercises[0].configuration!.weight).toBe(50);
    });

    it('should not mutate the original routine', () => {
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );

      routine.configureExercise('monday', 'ex-1', 3, 12, 50);
      expect(routine.days[0].exercises[0].configuration).toBeNull();
    });

    it('should reject configuring exercise in a non-existent day', () => {
      const days = [RoutineDay.create('monday')];
      const routine = Routine.create('id-1', 'My Routine', 'user-1', days);
      expect(() =>
        routine.configureExercise('friday', 'ex-1', 3, 12, 50),
      ).toThrow(RoutineDomainError);
      try {
        routine.configureExercise('friday', 'ex-1', 3, 12, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
        );
      }
    });

    it('should reject configuring a non-existent exercise', () => {
      const days = [RoutineDay.create('monday')];
      const routine = Routine.create('id-1', 'My Routine', 'user-1', days);
      expect(() =>
        routine.configureExercise('monday', 'nonexistent', 3, 12, 50),
      ).toThrow(RoutineDomainError);
      try {
        routine.configureExercise('monday', 'nonexistent', 3, 12, 50);
      } catch (error) {
        expect(error).toBeInstanceOf(RoutineDomainError);
        expect((error as RoutineDomainError).code).toBe(
          RoutineErrorCode.EXERCISE_NOT_FOUND,
        );
      }
    });

    it('should reject invalid sets via configureExercise (RF-11.0.1)', () => {
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );
      expect(() =>
        routine.configureExercise('monday', 'ex-1', 0, 12, 50),
      ).toThrow(RoutineDomainError);
    });

    it('should reject invalid repsPerSet via configureExercise (RF-11.0.2)', () => {
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );
      expect(() =>
        routine.configureExercise('monday', 'ex-1', 3, 0, 50),
      ).toThrow(RoutineDomainError);
    });

    it('should reject negative weight via configureExercise (RF-11.0.3)', () => {
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0)];
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );
      expect(() =>
        routine.configureExercise('monday', 'ex-1', 3, 12, -5),
      ).toThrow(RoutineDomainError);
    });

    it('should re-configure an already configured exercise', () => {
      const config = ExerciseConfiguration.reconstitute(3, 12, 50);
      const exercises = [Exercise.reconstitute('ex-1', 'Push-ups', 0, config)];
      const day = RoutineDay.reconstitute('monday', exercises);
      const routine = Routine.reconstitute(
        'id-1',
        'My Routine',
        'user-1',
        [day],
        new Date(),
        new Date(),
      );

      const updated = routine.configureExercise('monday', 'ex-1', 5, 8, 60);
      expect(updated.days[0].exercises[0].configuration!.sets).toBe(5);
      expect(updated.days[0].exercises[0].configuration!.repsPerSet).toBe(8);
      expect(updated.days[0].exercises[0].configuration!.weight).toBe(60);
      // Original unchanged
      expect(routine.days[0].exercises[0].configuration!.sets).toBe(3);
    });
  });
});

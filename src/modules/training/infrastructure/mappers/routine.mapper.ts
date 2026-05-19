import { Routine } from '../../domain/entities/routine.entity';
import { RoutineDay } from '../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../domain/entities/exercise.entity';
import { RoutineExerciseSet } from '../../domain/value-objects/routine-exercise-set.value-object';
import { RoutineTypeormEntity } from '../persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../persistence/typeorm/entities/exercise-typeorm.entity';
import { ExerciseSetTypeormEntity } from '../persistence/typeorm/entities/exercise-set-typeorm.entity';

export class RoutineMapper {
  public static toDomain(ormEntity: RoutineTypeormEntity): Routine {
    const days = (ormEntity.days ?? []).map((day) => {
      const exercises = (day.exercises ?? []).map((ex) => {
        const sets = (ex.sets ?? []).map((s) =>
          RoutineExerciseSet.reconstitute(
            s.id,
            s.setNumber,
            s.reps,
            s.weight,
            s.restSeconds,
          ),
        );
        return Exercise.reconstitute(ex.id, ex.name, ex.order, sets);
      });
      return RoutineDay.reconstitute(
        day.dayOfWeek as
          | 'monday'
          | 'tuesday'
          | 'wednesday'
          | 'thursday'
          | 'friday'
          | 'saturday'
          | 'sunday',
        exercises,
        day.id,
      );
    });

    return Routine.reconstitute(
      ormEntity.id,
      ormEntity.name,
      ormEntity.userId,
      days,
      ormEntity.isActive,
      ormEntity.trainingStrategyKey ?? null,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  public static toOrm(domain: Routine): RoutineTypeormEntity {
    const ormEntity = new RoutineTypeormEntity();
    ormEntity.id = domain.id;
    ormEntity.name = domain.name;
    ormEntity.userId = domain.userId;
    ormEntity.isActive = domain.isActive;
    ormEntity.trainingStrategyKey = domain.trainingStrategyKey;
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;

    ormEntity.days = domain.days.map((day) => {
      const dayOrm = new RoutineDayTypeormEntity();
      dayOrm.id = day.id ?? crypto.randomUUID();
      dayOrm.dayOfWeek = day.dayOfWeek;
      dayOrm.routineId = domain.id;

      dayOrm.exercises = day.exercises.map((exercise) => {
        const exOrm = new ExerciseTypeormEntity();
        exOrm.id = exercise.id;
        exOrm.name = exercise.name;
        exOrm.order = exercise.order;
        exOrm.routineDayId = dayOrm.id;

        exOrm.sets = exercise.sets.map((set) => {
          const setOrm = new ExerciseSetTypeormEntity();
          setOrm.id = set.id;
          setOrm.exerciseId = exercise.id;
          setOrm.exercise = exOrm;
          setOrm.setNumber = set.setNumber;
          setOrm.reps = set.reps;
          setOrm.weight = set.weight;
          setOrm.restSeconds = set.restSeconds;
          return setOrm;
        });

        return exOrm;
      });

      return dayOrm;
    });

    return ormEntity;
  }
}

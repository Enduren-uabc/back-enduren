import { Routine } from '../../domain/entities/routine.entity';
import { RoutineDay } from '../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../domain/entities/exercise.entity';
import { RoutineExerciseSet } from '../../domain/value-objects/routine-exercise-set.value-object';
import { RoutineTypeormEntity } from '../persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../persistence/typeorm/entities/exercise-typeorm.entity';
import { ExerciseSetTypeormEntity } from '../persistence/typeorm/entities/exercise-set-typeorm.entity';
import {
  isRoutineTargetAudience,
  type RoutineTargetAudience,
} from '../../domain/value-objects/routine-target-audience.value-object';

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
        return Exercise.reconstitute(
          ex.id,
          ex.name,
          ex.order,
          sets,
          ex.catalogId ?? null,
        );
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

    const targetAudience: RoutineTargetAudience = isRoutineTargetAudience(
      ormEntity.targetAudience,
    )
      ? ormEntity.targetAudience
      : 'self';

    return Routine.reconstitute({
      id: ormEntity.id,
      name: ormEntity.name,
      userId: ormEntity.userId,
      days,
      isActive: ormEntity.isActive,
      trainingStrategyKey: ormEntity.trainingStrategyKey ?? null,
      targetAudience,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  public static toOrm(domain: Routine): RoutineTypeormEntity {
    const ormEntity = new RoutineTypeormEntity();
    ormEntity.id = domain.id;
    ormEntity.name = domain.name;
    ormEntity.userId = domain.userId;
    ormEntity.isActive = domain.isActive;
    ormEntity.trainingStrategyKey = domain.trainingStrategyKey;
    ormEntity.targetAudience = domain.targetAudience;
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
        exOrm.catalogId = exercise.catalogId;
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

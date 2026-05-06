import { Routine } from '../../domain/entities/routine.entity';
import { RoutineDay } from '../../domain/value-objects/routine-day.value-object';
import { Exercise } from '../../domain/entities/exercise.entity';
import { ExerciseConfiguration } from '../../domain/value-objects/exercise-configuration.value-object';
import { RoutineTypeormEntity } from '../persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../persistence/typeorm/entities/exercise-typeorm.entity';

export class RoutineMapper {
  public static toDomain(ormEntity: RoutineTypeormEntity): Routine {
    const days = (ormEntity.days ?? []).map((day) => {
      const exercises = (day.exercises ?? []).map((ex) => {
        const configuration =
          ex.sets !== null && ex.repsPerSet !== null && ex.weight !== null
            ? ExerciseConfiguration.reconstitute(
                ex.sets,
                ex.repsPerSet,
                ex.weight,
              )
            : null;
        return Exercise.reconstitute(ex.id, ex.name, ex.order, configuration);
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
      );
    });

    return Routine.reconstitute(
      ormEntity.id,
      ormEntity.name,
      ormEntity.userId,
      days,
      ormEntity.isActive,
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
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;

    ormEntity.days = domain.days.map((day) => {
      const dayOrm = new RoutineDayTypeormEntity();
      dayOrm.id = crypto.randomUUID();
      dayOrm.dayOfWeek = day.dayOfWeek;
      dayOrm.routineId = domain.id;

      dayOrm.exercises = day.exercises.map((exercise) => {
        const exOrm = new ExerciseTypeormEntity();
        exOrm.id = exercise.id;
        exOrm.name = exercise.name;
        exOrm.order = exercise.order;
        exOrm.sets = exercise.configuration?.sets ?? null;
        exOrm.repsPerSet = exercise.configuration?.repsPerSet ?? null;
        exOrm.weight = exercise.configuration?.weight ?? null;
        exOrm.routineDayId = dayOrm.id;
        return exOrm;
      });

      return dayOrm;
    });

    return ormEntity;
  }
}

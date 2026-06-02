import { TrainerAssignedRoutine } from '../../domain/entities/trainer-assigned-routine.entity';
import { AssignedRoutineStatus } from '../../domain/value-objects/assigned-routine-status.vo';
import { RoutineSnapshot } from '../../domain/value-objects/routine-snapshot.vo';
import { ExerciseSnapshot } from '../../domain/value-objects/exercise-snapshot.vo';
import { RoutineDaySnapshot } from '../../domain/value-objects/routine-day-snapshot.vo';
import { TrainerAssignedRoutineTypeormEntity } from '../persistence/typeorm/entities/trainer-assigned-routine-typeorm.entity';

interface DayData {
  dayOfWeek: string;
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: number;
    reps: number;
    restSeconds: number;
    order: number;
  }>;
}

interface SnapshotData {
  routineId: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: number;
    reps: number;
    restSeconds: number;
    order: number;
  }>;
  days?: DayData[];
}

export class TrainerAssignedRoutineMapper {
  static toDomain(
    orm: TrainerAssignedRoutineTypeormEntity,
  ): TrainerAssignedRoutine {
    const snapshot = orm.routineSnapshot as unknown as SnapshotData;
    const exercises = (snapshot.exercises ?? []).map((e) =>
      ExerciseSnapshot.reconstitute({
        exerciseId: e.exerciseId,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.restSeconds,
        order: e.order,
      }),
    );

    const days = snapshot.days
      ? snapshot.days.map((d) =>
          RoutineDaySnapshot.reconstitute({
            dayOfWeek: d.dayOfWeek,
            exercises: d.exercises.map((e) =>
              ExerciseSnapshot.reconstitute({
                exerciseId: e.exerciseId,
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                restSeconds: e.restSeconds,
                order: e.order,
              }),
            ),
          }),
        )
      : [];

    return TrainerAssignedRoutine.reconstitute({
      id: orm.id,
      trainerId: orm.trainerId,
      clientId: orm.clientId,
      linkId: orm.linkId,
      routineId: orm.routineId,
      routineSnapshot: RoutineSnapshot.reconstitute({
        routineId: snapshot.routineId,
        name: snapshot.name,
        description: snapshot.description,
        difficulty: snapshot.difficulty,
        estimatedDuration: snapshot.estimatedDuration,
        exercises,
        days,
      }),
      status: AssignedRoutineStatus.from(orm.status),
      assignedAt: orm.assignedAt,
      replacedById: orm.replacedById,
      notes: orm.notes,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(
    domain: TrainerAssignedRoutine,
  ): TrainerAssignedRoutineTypeormEntity {
    const orm = new TrainerAssignedRoutineTypeormEntity();
    orm.id = domain.id;
    orm.trainerId = domain.trainerId;
    orm.clientId = domain.clientId;
    orm.linkId = domain.linkId;
    orm.routineId = domain.routineId;
    orm.routineSnapshot = {
      routineId: domain.routineSnapshot.routineId,
      name: domain.routineSnapshot.name,
      description: domain.routineSnapshot.description,
      difficulty: domain.routineSnapshot.difficulty,
      estimatedDuration: domain.routineSnapshot.estimatedDuration,
      exercises: domain.routineSnapshot.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        restSeconds: e.restSeconds,
        order: e.order,
      })),
      days: domain.routineSnapshot.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds,
          order: e.order,
        })),
      })),
    };
    orm.status = domain.status.value;
    orm.assignedAt = domain.assignedAt;
    orm.replacedById = domain.replacedById;
    orm.notes = domain.notes;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}

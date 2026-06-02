import { WorkoutSession } from '../../domain/entities/workout-session.entity';
import { WorkoutSessionStatus } from '../../domain/value-objects/workout-session-status.value-object';
import { WorkoutExercise } from '../../domain/value-objects/workout-exercise.value-object';
import { WorkoutSet } from '../../domain/value-objects/workout-set.value-object';
import type { DayOfWeek } from '../../domain/value-objects/routine-day.value-object';
import type { WorkoutSessionSourceType } from '../../domain/value-objects/workout-session-source.value-object';
import { WorkoutSessionTypeormEntity } from '../persistence/typeorm/entities/workout-session-typeorm.entity';
import { WorkoutSessionExerciseTypeormEntity } from '../persistence/typeorm/entities/workout-session-exercise-typeorm.entity';
import { WorkoutSessionSetTypeormEntity } from '../persistence/typeorm/entities/workout-session-set-typeorm.entity';

export class WorkoutSessionMapper {
  public static toDomain(
    ormEntity: WorkoutSessionTypeormEntity,
  ): WorkoutSession {
    const exercises = [...(ormEntity.exercises ?? [])]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((ex) => {
        const workoutSets = [...(ex.workoutSets ?? [])]
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((ws) =>
            WorkoutSet.reconstitute(
              ws.setNumber,
              ws.repsPerformed,
              ws.weightUsed,
              ws.completed,
              ws.targetReps,
              ws.targetWeight,
            ),
          );

        const targetSets = [...(ex.targetSets ?? [])]
          .sort((a, b) => a.setNumber - b.setNumber)
          .map((ts) => ({
            setNumber: ts.setNumber,
            reps: ts.reps,
            weight: ts.weight,
          }));

        return WorkoutExercise.reconstitute(
          ex.exerciseId,
          ex.exerciseName,
          ex.orderIndex,
          targetSets,
          workoutSets,
        );
      });

    return WorkoutSession.reconstitute({
      id: ormEntity.id,
      userId: ormEntity.userId,
      routineId: ormEntity.routineId,
      status: ormEntity.status as WorkoutSessionStatus,
      exercises,
      currentExerciseIndex: ormEntity.currentExerciseIndex ?? 0,
      startedAt: ormEntity.startedAt,
      finishedAt: ormEntity.finishedAt,
      dayOfWeek: (ormEntity.dayOfWeek ?? 'monday') as DayOfWeek,
      sourceType: (ormEntity.sourceType ?? 'personal') as WorkoutSessionSourceType,
      assignedRoutineId: ormEntity.assignedRoutineId ?? null,
    });
  }

  public static toOrm(domain: WorkoutSession): WorkoutSessionTypeormEntity {
    const ormEntity = new WorkoutSessionTypeormEntity();
    ormEntity.id = domain.id;
    ormEntity.userId = domain.userId;
    ormEntity.routineId = domain.routineId;
    ormEntity.sourceType = domain.sourceType;
    ormEntity.assignedRoutineId = domain.assignedRoutineId;
    ormEntity.dayOfWeek = domain.dayOfWeek;
    ormEntity.status = domain.status;
    ormEntity.currentExerciseIndex = domain.currentExerciseIndex;
    ormEntity.startedAt = domain.startedAt;
    ormEntity.finishedAt = domain.finishedAt;

    ormEntity.exercises = domain.exercises.map((ex) => {
      const exOrm = new WorkoutSessionExerciseTypeormEntity();
      exOrm.id = crypto.randomUUID();
      exOrm.sessionId = domain.id;
      exOrm.exerciseId = ex.exerciseId;
      exOrm.exerciseName = ex.exerciseName;
      exOrm.orderIndex = ex.order;
      exOrm.targetSets = ex.targetSets.map((ts) => ({
        setNumber: ts.setNumber,
        reps: ts.reps,
        weight: ts.weight,
      }));

      exOrm.workoutSets = ex.workoutSets.map((ws) => {
        const wsOrm = new WorkoutSessionSetTypeormEntity();
        wsOrm.id = crypto.randomUUID();
        wsOrm.sessionExerciseId = exOrm.id;
        wsOrm.setNumber = ws.setNumber;
        wsOrm.repsPerformed = ws.repsPerformed;
        wsOrm.weightUsed = ws.weightUsed;
        wsOrm.targetReps = ws.targetReps;
        wsOrm.targetWeight = ws.targetWeight;
        wsOrm.completed = ws.completed;
        return wsOrm;
      });

      return exOrm;
    });

    return ormEntity;
  }
}

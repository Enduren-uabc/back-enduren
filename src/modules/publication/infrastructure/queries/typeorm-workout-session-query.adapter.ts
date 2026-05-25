import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  WorkoutSessionQueryPort,
  WorkoutSessionData,
  WorkoutExerciseData,
} from '../../application/ports/workout-session-query.port';
import { ExerciseSummary } from '../../domain/value-objects/exercise-summary.value-object';

function countTargetSets(raw: unknown): number {
  if (raw == null) return 0;
  if (Array.isArray(raw)) return raw.length;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    if (raw.length === 0) return 0;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : Number(raw) || 0;
    } catch {
      return Number(raw) || 0;
    }
  }
  return 0;
}

@Injectable()
export class TypeormWorkoutSessionQueryAdapter implements WorkoutSessionQueryPort {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(sessionId: string): Promise<WorkoutSessionData | null> {
    const rows = await this.dataSource.query(
      `
      SELECT
        ws.id AS "sessionId",
        ws.routine_id AS "routineId",
        ws.day_of_week AS "dayOfWeek",
        ws.started_at AS "startedAt",
        ws.finished_at AS "finishedAt",
        r.name AS "routineName",
        wse.id AS "exerciseId",
        wse.exercise_name AS "exerciseName",
        wse.order_index AS "orderIndex",
        wse.target_sets AS "targetSets",
        wss.set_number AS "setNumber",
        wss.reps_performed AS "repsPerformed",
        wss.weight_used AS "weightUsed",
        wss.target_reps AS "targetReps",
        wss.target_weight AS "targetWeight",
        wss.completed AS "completed"
      FROM workout_sessions ws
      LEFT JOIN routines r ON r.id = ws.routine_id
      LEFT JOIN workout_session_exercises wse ON wse.session_id = ws.id
      LEFT JOIN workout_session_sets wss ON wss.session_exercise_id = wse.id
      WHERE ws.id = $1
      ORDER BY wse.order_index, wss.set_number
      `,
      [sessionId],
    );

    if (rows.length === 0) return null;

    const durationMinutes =
      rows[0].finishedAt && rows[0].startedAt
        ? Math.round(
            (new Date(rows[0].finishedAt).getTime() -
              new Date(rows[0].startedAt).getTime()) /
              60000,
          )
        : null;

    const exercisesMap = new Map<string, WorkoutExerciseData>();

    for (const row of rows) {
      if (!row.exerciseId) continue;

      if (!exercisesMap.has(row.exerciseId)) {
        exercisesMap.set(row.exerciseId, {
          exerciseId: row.exerciseId,
          exerciseName: row.exerciseName,
          completedSets: 0,
          totalSets: countTargetSets(row.targetSets),
          volume: 0,
          workoutSets: [],
        });
      }

      const exercise = exercisesMap.get(row.exerciseId)!;

      if (row.setNumber != null) {
        const weight = row.weightUsed ?? 0;
        const reps = row.repsPerformed ?? 0;
        exercise.workoutSets.push({
          setNumber: row.setNumber,
          repsPerformed: row.repsPerformed,
          weightUsed: row.weightUsed,
          targetReps: row.targetReps,
          targetWeight: row.targetWeight,
          completed: row.completed ?? false,
        });

        if (row.completed) {
          exercise.completedSets++;
          exercise.volume += weight * reps;
        }
      }
    }

    const exercises = Array.from(exercisesMap.values());

    return {
      id: rows[0].sessionId,
      routineName: rows[0].routineName ?? 'Rutina',
      dayOfWeek: rows[0].dayOfWeek ?? '',
      durationMinutes,
      exercises,
    };
  }

  buildExerciseSummary(session: WorkoutSessionData): ExerciseSummary {
    const totalCompletedSets = session.exercises.reduce(
      (sum, ex) => sum + ex.completedSets,
      0,
    );
    const totalSets = session.exercises.reduce(
      (sum, ex) => sum + ex.totalSets,
      0,
    );
    const totalVolume = session.exercises.reduce(
      (sum, ex) => sum + ex.volume,
      0,
    );

    return ExerciseSummary.create({
      totalExercises: session.exercises.length,
      totalCompletedSets,
      totalSets,
      totalVolume,
      durationMinutes: session.durationMinutes ?? 0,
      routineName: session.routineName,
      dayOfWeek: session.dayOfWeek,
      exercises: session.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        completedSets: ex.completedSets,
        totalSets: ex.totalSets,
        volume: ex.volume,
        workoutSets: ex.workoutSets.map((s) => ({
          setNumber: s.setNumber,
          repsPerformed: s.repsPerformed,
          weightUsed: s.weightUsed,
          targetReps: s.targetReps,
          targetWeight: s.targetWeight,
          completed: s.completed,
        })),
      })),
    });
  }
}

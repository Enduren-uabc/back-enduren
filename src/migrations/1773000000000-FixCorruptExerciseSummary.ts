import { MigrationInterface, QueryRunner } from 'typeorm';

interface WorkoutSetSummary {
  setNumber: number;
  repsPerformed: number | null;
  weightUsed: number | null;
  targetReps: number | null;
  targetWeight: number | null;
  completed: boolean;
}

interface ExerciseSummaryItem {
  exerciseId: string;
  exerciseName: string;
  completedSets: number;
  totalSets: number | string;
  volume: number;
  workoutSets: WorkoutSetSummary[] | string | unknown;
}

interface ExerciseSummary {
  totalExercises: number;
  totalCompletedSets: number | string;
  totalSets: number | string;
  totalVolume: number;
  durationMinutes: number;
  routineName: string;
  dayOfWeek: string;
  exercises: ExerciseSummaryItem[];
}

function normalizeSetsCount(raw: unknown, fallback: number): number {
  if (typeof raw === 'number' && !isNaN(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return fallback;
    const directNum = Number(trimmed);
    if (!isNaN(directNum)) return directNum;
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed.length : fallback;
      } catch {
        // no-op
      }
    }
    const prefixMatch = trimmed.match(/^(\d+)/);
    if (prefixMatch) {
      const prefix = parseInt(prefixMatch[1], 10);
      let arrayLengthSum = 0;
      const arrayRegex = /\[.*?\]/g;
      let m;
      while ((m = arrayRegex.exec(trimmed)) !== null) {
        try {
          const parsed = JSON.parse(m[0]);
          if (Array.isArray(parsed)) arrayLengthSum += parsed.length;
        } catch {
          // ignore
        }
      }
      if (arrayLengthSum > 0) return prefix + arrayLengthSum;
      return prefix;
    }
  }
  return fallback;
}

function normalizeWorkoutSets(raw: unknown): WorkoutSetSummary[] {
  if (Array.isArray(raw)) return raw as WorkoutSetSummary[];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length === 0) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? (parsed as WorkoutSetSummary[]) : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

export class FixCorruptExerciseSummary1773000000000 implements MigrationInterface {
  name = 'FixCorruptExerciseSummary1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(
      `SELECT id, exercise_summary FROM publications WHERE exercise_summary IS NOT NULL`,
    );

    for (const row of rows) {
      let summary: ExerciseSummary;
      try {
        summary =
          typeof row.exercise_summary === 'string'
            ? JSON.parse(row.exercise_summary)
            : row.exercise_summary;
      } catch {
        continue;
      }

      if (!summary || !Array.isArray(summary.exercises)) {
        continue;
      }

      let changed = false;
      let globalTotalSets = 0;
      let globalCompletedSets = 0;

      const cleanedExercises = summary.exercises.map((ex) => {
        const workoutSets = normalizeWorkoutSets(ex.workoutSets);
        const normalizedTotalSets = normalizeSetsCount(
          ex.totalSets,
          workoutSets.length,
        );

        if (normalizedTotalSets !== ex.totalSets) changed = true;
        if (workoutSets !== ex.workoutSets) changed = true;

        globalTotalSets += normalizedTotalSets;
        globalCompletedSets += ex.completedSets;

        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          completedSets: ex.completedSets,
          totalSets: normalizedTotalSets,
          volume: ex.volume,
          workoutSets,
        };
      });

      const normalizedGlobalTotalSets = normalizeSetsCount(
        summary.totalSets,
        globalTotalSets,
      );
      const normalizedGlobalCompletedSets = normalizeSetsCount(
        summary.totalCompletedSets,
        globalCompletedSets,
      );

      if (
        normalizedGlobalTotalSets !== summary.totalSets ||
        normalizedGlobalCompletedSets !== summary.totalCompletedSets
      ) {
        changed = true;
      }

      if (!changed) {
        continue;
      }

      const cleanedSummary: ExerciseSummary = {
        totalExercises: summary.totalExercises,
        totalCompletedSets: normalizedGlobalCompletedSets,
        totalSets: normalizedGlobalTotalSets,
        totalVolume: summary.totalVolume,
        durationMinutes: summary.durationMinutes,
        routineName: summary.routineName,
        dayOfWeek: summary.dayOfWeek,
        exercises: cleanedExercises,
      };

      await queryRunner.query(
        `UPDATE publications SET exercise_summary = $1 WHERE id = $2`,
        [JSON.stringify(cleanedSummary), row.id],
      );
    }
  }

  public async down(): Promise<void> {
    // No hay rollback posible para saneamiento de datos
  }
}

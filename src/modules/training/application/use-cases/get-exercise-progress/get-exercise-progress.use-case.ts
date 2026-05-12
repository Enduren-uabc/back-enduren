import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ExerciseProgressRecord {
  sessionId: string;
  date: Date;
  weightUsed: number;
  repsPerformed: number;
  setsCompleted: number;
  totalSets: number;
}

export interface ExerciseProgressOutput {
  sufficientData: boolean;
  exerciseId: string;
  exerciseName: string;
  records: ExerciseProgressRecord[];
  message: string | null;
}

/**
 * GetExerciseProgress use case (RF-13.0.3, RF-13.0.4, RF-13.0.6).
 * Returns exercise progress comparison across finished workout sessions.
 * When at least 2 finished sessions contain the exercise, returns
 * weight and reps evolution data ordered chronologically.
 * When fewer than 2 records exist, returns an insufficient-data response.
 */
export class GetExerciseProgressUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: { exerciseId: string },
  ): Promise<ExerciseProgressOutput> {
    const sessions =
      await this.workoutSessionRepository.findFinishedByUserIdAndExerciseId(
        actor.userId,
        input.exerciseId,
      );

    if (sessions.length === 0) {
      return {
        sufficientData: false,
        exerciseId: input.exerciseId,
        exerciseName: 'Unknown Exercise',
        records: [],
        message:
          'Insufficient data for progress comparison. At least 2 records are required.',
      };
    }

    // Resolve exerciseName from the first session that contains the exercise
    const exerciseName = this.resolveExerciseName(sessions, input.exerciseId);

    if (sessions.length < 2) {
      return {
        sufficientData: false,
        exerciseId: input.exerciseId,
        exerciseName,
        records: [],
        message:
          'Insufficient data for progress comparison. At least 2 records are required.',
      };
    }

    // Sessions are already ordered by startedAt ASC from the repository query
    const records: ExerciseProgressRecord[] = sessions.map((session) => {
      const exercise = session.exercises.find(
        (ex) => ex.exerciseId === input.exerciseId,
      );

      // Compute weightUsed: max weight across completed sets
      const completedSets = exercise!.workoutSets.filter((ws) => ws.completed);
      const weightUsed =
        completedSets.length > 0
          ? Math.max(...completedSets.map((ws) => ws.weightUsed ?? 0))
          : 0;

      // Compute repsPerformed: total reps across completed sets
      const repsPerformed = completedSets.reduce(
        (sum, ws) => sum + (ws.repsPerformed ?? 0),
        0,
      );

      // Count completed sets
      const setsCompleted = completedSets.length;

      // Total configured sets for this exercise in this session
      const totalSets = exercise!.targetSets.length;

      return {
        sessionId: session.id,
        date: session.startedAt,
        weightUsed,
        repsPerformed,
        setsCompleted,
        totalSets,
      };
    });

    return {
      sufficientData: true,
      exerciseId: input.exerciseId,
      exerciseName,
      records,
      message: null,
    };
  }

  private resolveExerciseName(
    sessions: Array<{
      exercises: Array<{ exerciseId: string; exerciseName: string }>;
    }>,
    exerciseId: string,
  ): string {
    for (const session of sessions) {
      const exercise = session.exercises.find(
        (ex) => ex.exerciseId === exerciseId,
      );
      if (exercise) {
        return exercise.exerciseName;
      }
    }
    return 'Unknown Exercise';
  }
}

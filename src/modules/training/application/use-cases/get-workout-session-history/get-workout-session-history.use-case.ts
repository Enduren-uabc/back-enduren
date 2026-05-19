import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface WorkoutSessionSummaryOutput {
  id: string;
  routineId: string;
  dayOfWeek: string;
  routineName: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMinutes: number | null;
  exerciseCount: number;
  status: string;
}

/**
 * GetWorkoutSessionHistory use case (RF-13, RF-13.0.1, RF-13.0.5).
 * Returns all finished workout sessions for the current user,
 * ordered by startedAt descending, with summary data including
 * routine name and computed duration.
 */
export class GetWorkoutSessionHistoryUseCase {
  constructor(
    private readonly workoutSessionRepository: WorkoutSessionRepository,
    private readonly routineRepository: RoutineRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
  ): Promise<WorkoutSessionSummaryOutput[]> {
    const sessions = await this.workoutSessionRepository.findFinishedByUserId(
      actor.userId,
    );

    if (sessions.length === 0) {
      return [];
    }

    // Collect unique routine IDs to resolve routine names
    const routineIds = [...new Set(sessions.map((s) => s.routineId))];
    const routineNames = new Map<string, string>();

    for (const routineId of routineIds) {
      const routine = await this.routineRepository.findById(routineId);
      routineNames.set(routineId, routine?.name ?? 'Unknown Routine');
    }

    return sessions.map((session) => {
      const durationMinutes =
        session.finishedAt && session.startedAt
          ? Math.round(
              ((session.finishedAt.getTime() - session.startedAt.getTime()) /
                60000) *
                10,
            ) / 10
          : null;

      return {
        id: session.id,
        routineId: session.routineId,
        dayOfWeek: session.dayOfWeek,
        routineName: routineNames.get(session.routineId) ?? 'Unknown Routine',
        startedAt: session.startedAt,
        finishedAt: session.finishedAt,
        durationMinutes,
        exerciseCount: session.exercises.length,
        status: session.status,
      };
    });
  }
}

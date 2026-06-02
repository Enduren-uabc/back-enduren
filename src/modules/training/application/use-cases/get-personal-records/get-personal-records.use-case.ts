import { Injectable, Inject } from '@nestjs/common';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { WORKOUT_SESSION_REPOSITORY_PORT } from '../start-workout-session/start-workout-session.use-case';
import { CurrentActor } from '../../ports/current-actor.port';

export interface PersonalRecordEntry {
  exerciseName: string;
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  sessionId: string;
}

export interface PersonalRecordsOutput {
  records: PersonalRecordEntry[];
  totalCount: number;
}

@Injectable()
export class GetPersonalRecordsUseCase {
  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  async execute(actor: CurrentActor): Promise<PersonalRecordsOutput> {
    const sessions = await this.workoutSessionRepository.findFinishedByUserId(
      actor.userId,
    );

    if (sessions.length === 0) {
      return { records: [], totalCount: 0 };
    }

    const bestByExercise = new Map<string, PersonalRecordEntry>();

    for (const session of sessions) {
      for (const exercise of session.exercises) {
        const completedSets = exercise.workoutSets.filter(
          (ws) => ws.completed && (ws.weightUsed ?? 0) > 0,
        );
        if (completedSets.length === 0) continue;

        const [first, ...rest] = completedSets;
        const bestSet = rest.reduce((best, ws) =>
          (ws.weightUsed ?? 0) > (best.weightUsed ?? 0) ? ws : best,
          first,
        );
        const currentWeight = bestSet.weightUsed ?? 0;
        const currentEntry = bestByExercise.get(exercise.exerciseId);

        if (!currentEntry || currentWeight > currentEntry.weight) {
          bestByExercise.set(exercise.exerciseId, {
            exerciseName: exercise.exerciseName,
            exerciseId: exercise.exerciseId,
            weight: currentWeight,
            reps: bestSet.repsPerformed ?? 0,
            date: session.startedAt.toISOString(),
            sessionId: session.id,
          });
        }
      }
    }

    const records = [...bestByExercise.values()].sort(
      (a, b) => b.weight - a.weight,
    );

    return { records, totalCount: records.length };
  }
}

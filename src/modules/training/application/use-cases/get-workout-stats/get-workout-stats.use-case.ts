import { Injectable, Inject } from '@nestjs/common';
import { WORKOUT_SESSION_REPOSITORY_PORT } from '../start-workout-session/start-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { CurrentActor } from '../../ports/current-actor.port';

export interface WorkoutStatsOutput {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
}

@Injectable()
export class GetWorkoutStatsUseCase {
  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  async execute(actor: CurrentActor): Promise<WorkoutStatsOutput> {
    const sessions = await this.workoutSessionRepository.findFinishedByUserId(
      actor.userId,
    );

    const totalWorkouts = sessions.length;

    if (totalWorkouts === 0) {
      return { totalWorkouts: 0, currentStreak: 0, longestStreak: 0 };
    }

    const uniqueDays = [
      ...new Set(
        sessions.map((s) => {
          const d = new Date(s.startedAt);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }),
      ),
    ].sort();

    let longestStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffMs = curr.getTime() - prev.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRun++;
        if (currentRun > longestStreak) {
          longestStreak = currentRun;
        }
      } else {
        currentRun = 1;
      }
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const lastSessionDay = uniqueDays[uniqueDays.length - 1];

    const lastDate = new Date(lastSessionDay);
    const diffFromLastMs = today.getTime() - lastDate.getTime();
    const diffFromLastDays = Math.round(diffFromLastMs / (1000 * 60 * 60 * 24));

    let currentStreak = 0;
    if (diffFromLastDays <= 1) {
      const uniqueDaysReversed = [...uniqueDays].reverse();
      currentStreak = 1;
      for (let i = 1; i < uniqueDaysReversed.length; i++) {
        const prev = new Date(uniqueDaysReversed[i - 1]);
        const curr = new Date(uniqueDaysReversed[i]);
        const diffMs = prev.getTime() - curr.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      totalWorkouts,
      currentStreak,
      longestStreak,
    };
  }
}

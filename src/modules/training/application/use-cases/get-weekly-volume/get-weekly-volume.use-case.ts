import { Injectable, Inject } from '@nestjs/common';
import { WorkoutSessionRepository } from '../../../domain/repositories/workout-session.repository.port';
import { WORKOUT_SESSION_REPOSITORY_PORT } from '../start-workout-session/start-workout-session.use-case';
import { CurrentActor } from '../../ports/current-actor.port';

export interface WeeklyVolumeEntry {
  weekStart: string;
  weekLabel: string;
  totalVolume: number;
  workoutCount: number;
}

export interface WeeklyVolumeOutput {
  entries: WeeklyVolumeEntry[];
}

@Injectable()
export class GetWeeklyVolumeUseCase {
  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  async execute(actor: CurrentActor): Promise<WeeklyVolumeOutput> {
    const sessions = await this.workoutSessionRepository.findFinishedByUserId(
      actor.userId,
    );

    if (sessions.length === 0) {
      return { entries: [] };
    }

    const weeklyMap = new Map<string, { totalVolume: number; count: number }>();

    for (const session of sessions) {
      const d = new Date(session.startedAt);
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);
      const weekKey = monday.toISOString().split('T')[0];

      let sessionVolume = 0;
      for (const exercise of session.exercises) {
        for (const ws of exercise.workoutSets) {
          if (ws.completed) {
            sessionVolume += (ws.weightUsed ?? 0) * (ws.repsPerformed ?? 0);
          }
        }
      }

      const entry = weeklyMap.get(weekKey) ?? { totalVolume: 0, count: 0 };
      entry.totalVolume += sessionVolume;
      entry.count += 1;
      weeklyMap.set(weekKey, entry);
    }

    const sortedWeeks = [...weeklyMap.entries()].sort(([a], [b]) =>
      b.localeCompare(a),
    );

    const entries: WeeklyVolumeEntry[] = sortedWeeks
      .slice(0, 12)
      .map(([weekStart, data]) => {
        const date = new Date(weekStart + 'T00:00:00');
        const day = date.getDate();
        const month = date.toLocaleDateString('es-MX', { month: 'short' });
        return {
          weekStart,
          weekLabel: `${day} ${month}`,
          totalVolume: Math.round(data.totalVolume * 10) / 10,
          workoutCount: data.count,
        };
      });

    return { entries };
  }
}

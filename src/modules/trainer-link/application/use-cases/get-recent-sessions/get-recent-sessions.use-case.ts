import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import { WORKOUT_SESSION_REPOSITORY_PORT } from '../../../../training/application/use-cases/start-workout-session/start-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../../training/domain/repositories/workout-session.repository.port';
import { RoutineRepository } from '../../../../training/domain/repositories/routine.repository';
import { ROUTINE_REPOSITORY_PORT } from '../../../../training/application/use-cases/create-routine/create-routine.use-case';

export interface RecentSessionOutput {
  sessionId: string;
  date: string;
  routineName: string;
  durationMinutes: number | null;
}

export interface GetRecentSessionsInput {
  trainerId: string;
  clientId: string;
}

export interface GetRecentSessionsOutput {
  sessions: RecentSessionOutput[];
}

@Injectable()
export class GetRecentSessionsUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    private readonly sessionRepository: WorkoutSessionRepository,
    @Inject(ROUTINE_REPOSITORY_PORT)
    private readonly routineRepository: RoutineRepository,
  ) {}

  async execute(
    input: GetRecentSessionsInput,
  ): Promise<GetRecentSessionsOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const sessions = await this.sessionRepository.findFinishedByUserId(
      input.clientId,
    );

    const recent = sessions.slice(0, 5);

    const routineIds = [...new Set(recent.map((s) => s.routineId))];
    const routineNames = new Map<string, string>();
    for (const routineId of routineIds) {
      const routine = await this.routineRepository.findById(routineId);
      routineNames.set(routineId, routine?.name ?? 'Unknown Routine');
    }

    const sessionOutputs: RecentSessionOutput[] = recent.map((s) => {
      const durationMinutes =
        s.finishedAt && s.startedAt
          ? Math.round(
              ((s.finishedAt.getTime() - s.startedAt.getTime()) / 60000) * 10,
            ) / 10
          : null;

      return {
        sessionId: s.id,
        date: s.startedAt.toISOString(),
        routineName: routineNames.get(s.routineId) ?? 'Unknown Routine',
        durationMinutes,
      };
    });

    return { sessions: sessionOutputs };
  }
}

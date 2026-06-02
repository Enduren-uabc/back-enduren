import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import { WORKOUT_SESSION_REPOSITORY_PORT } from '../../../../training/application/use-cases/start-workout-session/start-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../../training/domain/repositories/workout-session.repository.port';

export interface GetBasicIndicatorsInput {
  trainerId: string;
  clientId: string;
}

export interface GetBasicIndicatorsOutput {
  lastSessionDate: string | null;
  completedSessionsCount: number;
}

@Injectable()
export class GetBasicIndicatorsUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    private readonly sessionRepository: WorkoutSessionRepository,
  ) {}

  async execute(
    input: GetBasicIndicatorsInput,
  ): Promise<GetBasicIndicatorsOutput> {
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

    return {
      lastSessionDate:
        sessions.length > 0 ? sessions[0].startedAt.toISOString() : null,
      completedSessionsCount: sessions.length,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { GetClientGeneralInfoUseCase } from '../get-client-general-info/get-client-general-info.use-case';
import { GetRecentSessionsUseCase } from '../get-recent-sessions/get-recent-sessions.use-case';
import { GetBasicIndicatorsUseCase } from '../get-basic-indicators/get-basic-indicators.use-case';

export interface GetClientProgressInput {
  trainerId: string;
  clientId: string;
}

export interface GetClientProgressOutput {
  generalInfo: {
    clientName: string;
    activeRoutineName: string | null;
  };
  recentSessions: Array<{
    sessionId: string;
    date: string;
    routineName: string;
    durationMinutes: number | null;
  }>;
  indicators: {
    lastSessionDate: string | null;
    completedSessionsCount: number;
  };
}

@Injectable()
export class GetClientProgressUseCase {
  constructor(
    private readonly generalInfoUseCase: GetClientGeneralInfoUseCase,
    private readonly recentSessionsUseCase: GetRecentSessionsUseCase,
    private readonly indicatorsUseCase: GetBasicIndicatorsUseCase,
  ) {}

  async execute(
    input: GetClientProgressInput,
  ): Promise<GetClientProgressOutput> {
    const [generalInfo, recentSessions, indicators] = await Promise.all([
      this.generalInfoUseCase.execute({
        trainerId: input.trainerId,
        clientId: input.clientId,
      }),
      this.recentSessionsUseCase.execute({
        trainerId: input.trainerId,
        clientId: input.clientId,
      }),
      this.indicatorsUseCase.execute({
        trainerId: input.trainerId,
        clientId: input.clientId,
      }),
    ]);

    return {
      generalInfo,
      recentSessions: recentSessions.sessions,
      indicators,
    };
  }
}

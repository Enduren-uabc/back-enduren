import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { GetActiveLinksUseCase } from '../../../application/use-cases/get-active-links/get-active-links.use-case';
import { GetMyTrainerUseCase } from '../../../application/use-cases/get-my-trainer/get-my-trainer.use-case';
import { DeactivateLinkUseCase } from '../../../application/use-cases/deactivate-link/deactivate-link.use-case';
import { GetClientGeneralInfoUseCase } from '../../../application/use-cases/get-client-general-info/get-client-general-info.use-case';
import { GetRecentSessionsUseCase } from '../../../application/use-cases/get-recent-sessions/get-recent-sessions.use-case';
import { GetBasicIndicatorsUseCase } from '../../../application/use-cases/get-basic-indicators/get-basic-indicators.use-case';
import { GetClientProgressUseCase } from '../../../application/use-cases/get-client-progress/get-client-progress.use-case';
import { GetClientExerciseProgressUseCase } from '../../../application/use-cases/get-client-exercise-progress/get-client-exercise-progress.use-case';
import { DeactivateLinkRequestDto } from '../dtos/deactivate-link.request';
import { ActiveLinkResponseDto } from '../dtos/active-link.response';
import { ClientGeneralInfoResponseDto } from '../dtos/client-general-info.response';
import { RecentSessionResponseDto } from '../dtos/recent-session.response';
import { BasicIndicatorsResponseDto } from '../dtos/basic-indicators.response';
import { ClientProgressResponseDto } from '../dtos/client-progress.response';
import { ClientGuard } from '../guards/client.guard';
import { TrainerVerifiedGuard } from '../../../../trainer-verification/presentation/http/guards/trainer-verified.guard';
import { TrainerLinkErrorFilter } from '../filters/trainer-link-error.filter';

@Controller('trainer-links')
@UseGuards(JwtAuthGuard)
@UseFilters(TrainerLinkErrorFilter)
export class TrainerLinkController {
  constructor(
    private readonly getActiveLinksUseCase: GetActiveLinksUseCase,
    private readonly getMyTrainerUseCase: GetMyTrainerUseCase,
    private readonly deactivateLinkUseCase: DeactivateLinkUseCase,
  ) {}

  @Get('active')
  @UseGuards(ClientGuard)
  async getMyTrainer(@CurrentUser() user: JwtPayload): Promise<any> {
    const result = await this.getMyTrainerUseCase.execute(user.sub);
    if (!result) {
      return { hasTrainer: false, trainer: null };
    }
    return {
      hasTrainer: true,
      trainer: result,
    };
  }

  @Patch(':id/deactivate')
  async deactivateLink(
    @CurrentUser() user: JwtPayload,
    @Param('id') linkId: string,
    @Body() dto: DeactivateLinkRequestDto,
  ): Promise<{ linkId: string; status: string; deactivatedAt: Date }> {
    const result = await this.deactivateLinkUseCase.execute({
      actorId: user.sub,
      linkId,
      reason: dto.reason,
    });

    return {
      linkId: result.linkId,
      status: result.status,
      deactivatedAt: result.deactivatedAt,
    };
  }
}

@Controller('trainer')
@UseGuards(JwtAuthGuard)
@UseFilters(TrainerLinkErrorFilter)
export class TrainerClientsController {
  constructor(
    private readonly getActiveLinksUseCase: GetActiveLinksUseCase,
    private readonly getClientGeneralInfoUseCase: GetClientGeneralInfoUseCase,
    private readonly getRecentSessionsUseCase: GetRecentSessionsUseCase,
    private readonly getBasicIndicatorsUseCase: GetBasicIndicatorsUseCase,
    private readonly getClientProgressUseCase: GetClientProgressUseCase,
    private readonly getClientExerciseProgressUseCase: GetClientExerciseProgressUseCase,
  ) {}

  @Get('clients')
  @UseGuards(TrainerVerifiedGuard)
  async getActiveClients(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    items: ActiveLinkResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.getActiveLinksUseCase.execute({
      actorId: user.sub,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });

    return {
      items: result.items.map((item) => ({
        linkId: item.linkId,
        clientId: item.clientId,
        clientName: item.clientName,
        linkStatus: item.linkStatus,
        activatedAt: item.activatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('clients/:clientId')
  @UseGuards(TrainerVerifiedGuard)
  async getClientGeneralInfo(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
  ): Promise<ClientGeneralInfoResponseDto> {
    const result = await this.getClientGeneralInfoUseCase.execute({
      trainerId: user.sub,
      clientId,
    });

    return {
      clientName: result.clientName,
      activeRoutineName: result.activeRoutineName,
    };
  }

  @Get('clients/:clientId/sessions/recent')
  @UseGuards(TrainerVerifiedGuard)
  async getRecentSessions(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
  ): Promise<RecentSessionResponseDto[]> {
    const result = await this.getRecentSessionsUseCase.execute({
      trainerId: user.sub,
      clientId,
    });

    return result.sessions.map((s) => ({
      sessionId: s.sessionId,
      date: s.date,
      routineName: s.routineName,
      durationMinutes: s.durationMinutes,
    }));
  }

  @Get('clients/:clientId/indicators')
  @UseGuards(TrainerVerifiedGuard)
  async getBasicIndicators(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
  ): Promise<BasicIndicatorsResponseDto> {
    const result = await this.getBasicIndicatorsUseCase.execute({
      trainerId: user.sub,
      clientId,
    });

    return {
      lastSessionDate: result.lastSessionDate,
      completedSessionsCount: result.completedSessionsCount,
    };
  }

  @Get('clients/:clientId/progress')
  @UseGuards(TrainerVerifiedGuard)
  async getClientProgress(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
  ): Promise<ClientProgressResponseDto> {
    const result = await this.getClientProgressUseCase.execute({
      trainerId: user.sub,
      clientId,
    });

    return {
      generalInfo: {
        clientName: result.generalInfo.clientName,
        activeRoutineName: result.generalInfo.activeRoutineName,
      },
      recentSessions: result.recentSessions.map((s) => ({
        sessionId: s.sessionId,
        date: s.date,
        routineName: s.routineName,
        durationMinutes: s.durationMinutes,
      })),
      indicators: {
        lastSessionDate: result.indicators.lastSessionDate,
        completedSessionsCount: result.indicators.completedSessionsCount,
      },
    };
  }

  @Get('clients/:clientId/progress/exercises/:exerciseId')
  @UseGuards(TrainerVerifiedGuard)
  async getClientExerciseProgress(
    @CurrentUser() user: JwtPayload,
    @Param('clientId') clientId: string,
    @Param('exerciseId') exerciseId: string,
  ): Promise<{
    sufficientData: boolean;
    exerciseId: string;
    exerciseName: string;
    records: Array<{
      sessionId: string;
      date: string;
      weightUsed: number;
      repsPerformed: number;
      setsCompleted: number;
      totalSets: number;
    }>;
    message: string | null;
  }> {
    const result = await this.getClientExerciseProgressUseCase.execute({
      trainerId: user.sub,
      clientId,
      exerciseId,
    });

    return {
      sufficientData: result.sufficientData,
      exerciseId: result.exerciseId,
      exerciseName: result.exerciseName,
      records: result.records.map((r) => ({
        sessionId: r.sessionId,
        date: r.date,
        weightUsed: r.weightUsed,
        repsPerformed: r.repsPerformed,
        setsCompleted: r.setsCompleted,
        totalSets: r.totalSets,
      })),
      message: result.message,
    };
  }
}

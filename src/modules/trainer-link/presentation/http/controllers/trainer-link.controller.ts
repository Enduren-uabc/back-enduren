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
import { DeactivateLinkRequestDto } from '../dtos/deactivate-link.request';
import { ActiveLinkResponseDto } from '../dtos/active-link.response';
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
  constructor(private readonly getActiveLinksUseCase: GetActiveLinksUseCase) {}

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
        activatedAt: item.activatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}

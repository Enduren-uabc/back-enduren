import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { SendLinkRequestUseCase } from '../../../application/use-cases/send-link-request/send-link-request.use-case';
import { CancelLinkRequestUseCase } from '../../../application/use-cases/cancel-link-request/cancel-link-request.use-case';
import { ListSentLinkRequestsUseCase } from '../../../application/use-cases/list-sent-link-requests/list-sent-link-requests.use-case';
import { ListReceivedLinkRequestsUseCase } from '../../../application/use-cases/list-received-link-requests/list-received-link-requests.use-case';
import { AcceptLinkRequestUseCase } from '../../../application/use-cases/accept-link-request/accept-link-request.use-case';
import { RejectLinkRequestUseCase } from '../../../application/use-cases/reject-link-request/reject-link-request.use-case';
import { SendLinkRequestRequestDto } from '../dtos/send-link-request.request';
import { ListLinkRequestsRequestDto } from '../dtos/list-link-requests.request';
import { RejectLinkRequestRequestDto } from '../dtos/reject-link-request.request';
import { LinkRequestResponseDto } from '../dtos/link-request.response';
import { AcceptLinkRequestResponseDto } from '../dtos/accept-link-request.response';
import { ClientGuard } from '../guards/client.guard';
import { TrainerVerifiedGuard } from '../../../../trainer-verification/presentation/http/guards/trainer-verified.guard';
import { TrainerLinkErrorFilter } from '../filters/trainer-link-error.filter';
import { LinkRequestStatus } from '../../../domain/value-objects/link-status.vo';

@Controller('trainer-link-requests')
@UseGuards(JwtAuthGuard)
@UseFilters(TrainerLinkErrorFilter)
export class TrainerLinkRequestController {
  constructor(
    private readonly sendLinkRequestUseCase: SendLinkRequestUseCase,
    private readonly cancelLinkRequestUseCase: CancelLinkRequestUseCase,
    private readonly listSentLinkRequestsUseCase: ListSentLinkRequestsUseCase,
    private readonly listReceivedLinkRequestsUseCase: ListReceivedLinkRequestsUseCase,
    private readonly acceptLinkRequestUseCase: AcceptLinkRequestUseCase,
    private readonly rejectLinkRequestUseCase: RejectLinkRequestUseCase,
  ) {}

  @Post()
  @UseGuards(ClientGuard)
  async sendRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendLinkRequestRequestDto,
  ): Promise<LinkRequestResponseDto> {
    const result = await this.sendLinkRequestUseCase.execute({
      actorId: user.sub,
      trainerId: dto.trainerId,
      message: dto.message,
    });

    return {
      id: result.id,
      clientId: result.clientId,
      trainerId: result.trainerId,
      status: result.status,
      message: null,
      rejectionReason: null,
      createdAt: result.createdAt,
      updatedAt: result.createdAt,
    };
  }

  @Get('sent')
  @UseGuards(ClientGuard)
  async listSent(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListLinkRequestsRequestDto,
  ) {
    const result = await this.listSentLinkRequestsUseCase.execute({
      actorId: user.sub,
      status: query.status as LinkRequestStatus | undefined,
      page: query.page ? Number.parseInt(query.page, 10) : 1,
      limit: query.limit ? Number.parseInt(query.limit, 10) : 10,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get('received')
  @UseGuards(TrainerVerifiedGuard)
  async listReceived(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListLinkRequestsRequestDto,
  ) {
    const result = await this.listReceivedLinkRequestsUseCase.execute({
      actorId: user.sub,
      status: query.status as LinkRequestStatus | undefined,
      page: query.page ? Number.parseInt(query.page, 10) : 1,
      limit: query.limit ? Number.parseInt(query.limit, 10) : 10,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Patch(':id/cancel')
  @UseGuards(ClientGuard)
  async cancelRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
  ): Promise<LinkRequestResponseDto> {
    const result = await this.cancelLinkRequestUseCase.execute({
      actorId: user.sub,
      requestId,
    });

    return {
      id: result.id,
      clientId: '',
      trainerId: '',
      status: result.status,
      message: null,
      rejectionReason: null,
      createdAt: result.cancelledAt,
      updatedAt: result.cancelledAt,
    };
  }

  @Patch(':id/accept')
  @UseGuards(TrainerVerifiedGuard)
  async acceptRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
  ): Promise<AcceptLinkRequestResponseDto> {
    const result = await this.acceptLinkRequestUseCase.execute({
      actorId: user.sub,
      requestId,
    });

    return {
      requestId: result.requestId,
      linkId: result.linkId,
      status: result.status,
      activatedAt: result.activatedAt,
    };
  }

  @Patch(':id/reject')
  @UseGuards(TrainerVerifiedGuard)
  async rejectRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
    @Body() dto: RejectLinkRequestRequestDto,
  ): Promise<LinkRequestResponseDto> {
    const result = await this.rejectLinkRequestUseCase.execute({
      actorId: user.sub,
      requestId,
      reason: dto.reason,
    });

    return {
      id: result.requestId,
      clientId: '',
      trainerId: '',
      status: result.status,
      message: null,
      rejectionReason: result.rejectionReason,
      createdAt: result.respondedAt,
      updatedAt: result.respondedAt,
    };
  }
}

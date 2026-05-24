import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import type { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { NotificationRepository } from '../../../domain/repositories/notification.repository.port';
import { NotificationResponseDto } from '../dtos/notification-response.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  @Get()
  public async list(
    @CurrentUser() user: JwtPayload,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findByUserId(user.sub);

    return notifications.map((n) => {
      const dto = new NotificationResponseDto();
      dto.id = n.id;
      dto.title = n.title;
      dto.body = n.body;
      dto.type = n.type;
      dto.readAt = n.readAt?.toISOString() ?? null;
      dto.createdAt = n.createdAt.toISOString();
      return dto;
    });
  }

  @Get('unread-count')
  public async unreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ count: number }> {
    const count = await this.notificationRepository.countUnread(user.sub);
    return { count };
  }

  @Patch(':id/read')
  public async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notificationRepository.markAsRead(id);
  }
}

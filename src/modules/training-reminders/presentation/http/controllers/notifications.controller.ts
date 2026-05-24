import { Controller, Get, Patch, Post, Param, UseGuards, Logger, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import type { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { NotificationRepository, NOTIFICATION_REPOSITORY_PORT } from '../../../domain/repositories/notification.repository.port';
import { PushTokenRepository, PUSH_TOKEN_REPOSITORY_PORT } from '../../../domain/repositories/push-token.repository.port';
import { PushNotificationPort, PUSH_NOTIFICATION_PORT } from '../../../application/ports/push-notification.port';
import { InAppNotification } from '../../../domain/entities/notification.entity';
import { NotificationResponseDto } from '../dtos/notification-response.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY_PORT)
    private readonly notificationRepository: NotificationRepository,
    @Inject(PUSH_TOKEN_REPOSITORY_PORT)
    private readonly pushTokenRepository: PushTokenRepository,
    @Inject(PUSH_NOTIFICATION_PORT)
    private readonly pushService: PushNotificationPort,
  ) {}

  @Post('test')
  public async sendTest(@CurrentUser() user: JwtPayload): Promise<{ ok: boolean; message: string }> {
    const title = '🔔 Notificación de prueba';
    const body = 'Si ves esto, el módulo de notificaciones funciona correctamente.';

    const notification = InAppNotification.create(user.sub, title, body);
    await this.notificationRepository.save(notification);

    const tokens = await this.pushTokenRepository.findByUserId(user.sub);
    const tokenValues = tokens.map((t) => t.token);

    if (tokenValues.length > 0) {
      await this.pushService.send(user.sub, title, body, tokenValues);
      this.logger.log(`Test push sent to user ${user.sub} (${tokenValues.length} tokens)`);
    } else {
      this.logger.warn(`No push tokens for user ${user.sub}. Push skipped, in-app saved.`);
    }

    return {
      ok: true,
      message: tokenValues.length > 0
        ? 'Notificación creada y push enviado'
        : 'Notificación creada (sin token push registrado)',
    };
  }

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

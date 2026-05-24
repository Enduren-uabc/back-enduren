import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import type { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';
import { PushTokenRepository } from '../../../domain/repositories/push-token.repository.port';
import { PushToken } from '../../../domain/entities/push-token.entity';
import { RegisterPushTokenRequestDto } from '../dtos/register-push-token.dto';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushTokenController {
  constructor(
    private readonly pushTokenRepository: PushTokenRepository,
  ) {}

  @Post('register-token')
  public async registerToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterPushTokenRequestDto,
  ): Promise<void> {
    await this.pushTokenRepository.deleteByToken(dto.token);
    const token = PushToken.create(user.sub, dto.token, dto.platform);
    await this.pushTokenRepository.save(token);
  }
}

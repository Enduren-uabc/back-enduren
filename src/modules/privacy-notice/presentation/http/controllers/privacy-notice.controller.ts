import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Public } from '../../../../auth/presentation/http/decorators/public.decorator';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import {
  PrivacyNoticeRepositoryPort,
  PRIVACY_NOTICE_REPOSITORY_PORT,
} from '../../../domain/repositories/privacy-notice-repository.port';
import { PrivacyNoticeResponseDto } from '../dtos/privacy-notice-response.dto';

@Controller('privacy-notice')
export class PrivacyNoticeController {
  constructor(
    @Inject(PRIVACY_NOTICE_REPOSITORY_PORT)
    private readonly repo: PrivacyNoticeRepositoryPort,
  ) {}

  @Get('current')
  @HttpCode(HttpStatus.OK)
  async getCurrent(): Promise<PrivacyNoticeResponseDto> {
    const notice = await this.repo.findCurrent();
    if (!notice) {
      throw new NotFoundException(
        'El aviso de privacidad no está disponible en este momento',
      );
    }
    return {
      version: notice.version,
      updatedAt: notice.updatedAt.toISOString(),
      content: notice.content,
      contentHash: notice.contentHash ?? undefined,
    };
  }
}

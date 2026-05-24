import { Module } from '@nestjs/common';
import { PrivacyNoticeInfrastructureModule } from '../infrastructure/privacy-notice-infrastructure.module';
import { PrivacyNoticeController } from './http/controllers/privacy-notice.controller';

@Module({
  imports: [PrivacyNoticeInfrastructureModule],
  controllers: [PrivacyNoticeController],
})
export class PrivacyNoticePresentationModule {}

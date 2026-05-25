import { Module } from '@nestjs/common';
import { PrivacyNoticeInfrastructureModule } from './infrastructure/privacy-notice-infrastructure.module';
import { PrivacyNoticePresentationModule } from './presentation/privacy-notice-presentation.module';

@Module({
  imports: [PrivacyNoticeInfrastructureModule, PrivacyNoticePresentationModule],
})
export class PrivacyNoticeModule {}

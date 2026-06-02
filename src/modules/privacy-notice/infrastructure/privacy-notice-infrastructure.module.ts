import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrivacyNoticeTypeormEntity } from './persistence/typeorm/entities/privacy-notice-typeorm.entity';
import { PrivacyNoticeTypeormRepository } from './persistence/typeorm/repositories/privacy-notice-typeorm.repository';
import { PRIVACY_NOTICE_REPOSITORY_PORT } from '../domain/repositories/privacy-notice-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([PrivacyNoticeTypeormEntity])],
  providers: [
    {
      provide: PRIVACY_NOTICE_REPOSITORY_PORT,
      useClass: PrivacyNoticeTypeormRepository,
    },
  ],
  exports: [PRIVACY_NOTICE_REPOSITORY_PORT],
})
export class PrivacyNoticeInfrastructureModule {}

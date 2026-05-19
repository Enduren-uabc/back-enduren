import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { TrainerVerificationStorageStrategy } from '../trainer-verification/infrastructure/storage/trainer-verification-storage.strategy';
import { UploadRootPdfSmokeTestUseCase } from './application/use-cases/upload-root-pdf-smoke-test.use-case';
import { StorageSmokeTestController } from './presentation/http/controllers/storage-smoke-test.controller';

@Module({
  imports: [StorageModule.forFeature(TrainerVerificationStorageStrategy)],
  controllers: [StorageSmokeTestController],
  providers: [UploadRootPdfSmokeTestUseCase],
})
export class StorageSmokeTestModule {}

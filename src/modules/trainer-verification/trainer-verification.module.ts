import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../shared/storage/storage.module';
import { ProfileTypeormEntity } from '../profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { UserTypeormEntity } from '../users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { UsersModule } from '../users/users.module';
import { TRAINER_FLOW_CONFIG_PORT } from './application/ports/trainer-flow-config.port';
import { GetMyVerificationStatusUseCase } from './application/use-cases/get-my-verification-status/get-my-verification-status.use-case';
import { GetVerificationDetailUseCase } from './application/use-cases/get-verification-detail/get-verification-detail.use-case';
import { ListPendingVerificationsUseCase } from './application/use-cases/list-pending-verifications/list-pending-verifications.use-case';
import { ListSpecialtyCatalogUseCase } from './application/use-cases/list-specialty-catalog/list-specialty-catalog.use-case';
import { ReviewTrainerVerificationUseCase } from './application/use-cases/review-trainer-verification/review-trainer-verification.use-case';
import { SubmitTrainerVerificationUseCase } from './application/use-cases/submit-trainer-verification/submit-trainer-verification.use-case';
import { UpdateTrainerVerificationUseCase } from './application/use-cases/update-trainer-verification/update-trainer-verification.use-case';
import { SPECIALTY_CATALOG_REPOSITORY_PORT } from './domain/repositories/specialty-catalog.repository.port';
import { TRAINER_VERIFICATION_REPOSITORY_PORT } from './domain/repositories/trainer-verification.repository.port';
import { SpecialtyCatalogTypeormEntity } from './infrastructure/persistence/typeorm/entities/specialty-catalog-typeorm.entity';
import { TrainerCertificateTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-certificate-typeorm.entity';
import { TrainerIdDocumentTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-id-document-typeorm.entity';
import { TrainerVerificationSpecialtyTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-verification-specialty-typeorm.entity';
import { TrainerVerificationTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-verification-typeorm.entity';
import { TypeormSpecialtyCatalogRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-specialty-catalog.repository';
import { TypeormTrainerVerificationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-trainer-verification.repository';
import { SpecialtyCatalogSeeder } from './infrastructure/persistence/typeorm/specialty-catalog-seeder.service';
import { EnvTrainerFlowConfigService } from './infrastructure/config/env-trainer-flow-config.service';
import { TrainerVerificationStorageStrategy } from './infrastructure/storage/trainer-verification-storage.strategy';
import { TrainerVerificationController } from './presentation/http/controllers/trainer-verification.controller';
import { TrainerVerifiedGuard } from './presentation/http/guards/trainer-verified.guard';

@Module({
  imports: [
    UsersModule,
    StorageModule.forFeature(TrainerVerificationStorageStrategy),
    TypeOrmModule.forFeature([
      TrainerVerificationTypeormEntity,
      TrainerVerificationSpecialtyTypeormEntity,
      TrainerIdDocumentTypeormEntity,
      TrainerCertificateTypeormEntity,
      SpecialtyCatalogTypeormEntity,
      UserTypeormEntity,
      ProfileTypeormEntity,
    ]),
  ],
  controllers: [TrainerVerificationController],
  providers: [
    {
      provide: TRAINER_FLOW_CONFIG_PORT,
      useClass: EnvTrainerFlowConfigService,
    },
    {
      provide: TRAINER_VERIFICATION_REPOSITORY_PORT,
      useClass: TypeormTrainerVerificationRepository,
    },
    {
      provide: SPECIALTY_CATALOG_REPOSITORY_PORT,
      useClass: TypeormSpecialtyCatalogRepository,
    },
    SubmitTrainerVerificationUseCase,
    GetMyVerificationStatusUseCase,
    UpdateTrainerVerificationUseCase,
    ListPendingVerificationsUseCase,
    GetVerificationDetailUseCase,
    ReviewTrainerVerificationUseCase,
    ListSpecialtyCatalogUseCase,
    TrainerVerifiedGuard,
    SpecialtyCatalogSeeder,
  ],
  exports: [TRAINER_VERIFICATION_REPOSITORY_PORT, TrainerVerifiedGuard],
})
export class TrainerVerificationModule {}

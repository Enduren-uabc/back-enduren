import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { StorageModule } from '../../shared/storage/storage.module';
import { ProfileTypeormEntity } from '../profile/infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { UserTypeormEntity } from '../users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { UsersModule } from '../users/users.module';
import { TRAINER_FLOW_CONFIG_PORT } from './application/ports/trainer-flow-config.port';
import { DOCUMENT_EXTRACTION_PORT } from './application/ports/document-extraction.port';
import { GetMyVerificationStatusUseCase } from './application/use-cases/get-my-verification-status/get-my-verification-status.use-case';
import { GetVerificationDetailUseCase } from './application/use-cases/get-verification-detail/get-verification-detail.use-case';
import { ListPendingVerificationsUseCase } from './application/use-cases/list-pending-verifications/list-pending-verifications.use-case';
import { ListSpecialtyCatalogUseCase } from './application/use-cases/list-specialty-catalog/list-specialty-catalog.use-case';
import { ReviewTrainerVerificationUseCase } from './application/use-cases/review-trainer-verification/review-trainer-verification.use-case';
import { CreatePowerspikeDraftUseCase } from './application/use-cases/create-powerspike-draft/create-powerspike-draft.use-case';
import { SubmitPowerspikeVerificationUseCase } from './application/use-cases/submit-powerspike-verification/submit-powerspike-verification.use-case';
import { SubmitTrainerVerificationUseCase } from './application/use-cases/submit-trainer-verification/submit-trainer-verification.use-case';
import { UpdateTrainerVerificationUseCase } from './application/use-cases/update-trainer-verification/update-trainer-verification.use-case';
import { UploadPowerspikeCertificateUseCase } from './application/use-cases/upload-powerspike-certificate/upload-powerspike-certificate.use-case';
import { UploadPowerspikeIdDocumentUseCase } from './application/use-cases/upload-powerspike-id-document/upload-powerspike-id-document.use-case';
import { ExtractCertificateHandler } from './application/handlers/extract-certificate.handler';
import { ExtractIdDocumentHandler } from './application/handlers/extract-id-document.handler';
import { OnCertificateExtractedHandler } from './application/handlers/on-certificate-extracted.handler';
import { OnCertificateExtractionFailedHandler } from './application/handlers/on-certificate-extraction-failed.handler';
import { OnIdDocumentExtractedHandler } from './application/handlers/on-id-document-extracted.handler';
import { OnIdDocumentExtractionFailedHandler } from './application/handlers/on-id-document-extraction-failed.handler';
import { SPECIALTY_CATALOG_REPOSITORY_PORT } from './domain/repositories/specialty-catalog.repository.port';
import { TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT } from './domain/repositories/trainer-verification-audit.repository.port';
import { TRAINER_VERIFICATION_REPOSITORY_PORT } from './domain/repositories/trainer-verification.repository.port';
import { TrainerVerificationStateMachineService } from './application/services/trainer-verification-state-machine.service';
import { InMemoryCommandBus } from './infrastructure/cqrs/in-memory-command-bus';
import { InMemoryEventBus } from './infrastructure/cqrs/in-memory-event-bus';
import { FakeDocumentExtractionService } from './infrastructure/document-extraction/fake-document-extraction.service';
import { AzureDocumentIntelligenceService } from './infrastructure/document-extraction/azure-document-intelligence.service';
import { SpecialtyCatalogTypeormEntity } from './infrastructure/persistence/typeorm/entities/specialty-catalog-typeorm.entity';
import { TrainerCertificateTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-certificate-typeorm.entity';
import { TrainerIdDocumentTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-id-document-typeorm.entity';
import { TrainerVerificationAdvancedStatusTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-verification-advanced-status-typeorm.entity';
import { TrainerVerificationAuditEventTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-verification-audit-event-typeorm.entity';
import { TrainerVerificationStatusHistoryTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-verification-status-history-typeorm.entity';
import { TrainerVerificationSpecialtyTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-verification-specialty-typeorm.entity';
import { TrainerVerificationTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-verification-typeorm.entity';
import { ExtractedCertificateDataTypeormEntity } from './infrastructure/persistence/typeorm/entities/extracted-certificate-data-typeorm.entity';
import { ExtractedIdDataTypeormEntity } from './infrastructure/persistence/typeorm/entities/extracted-id-data-typeorm.entity';
import { TypeormSpecialtyCatalogRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-specialty-catalog.repository';
import { TypeormTrainerVerificationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-trainer-verification.repository';
import { TypeormTrainerVerificationAuditRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-trainer-verification-audit.repository';
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
      TrainerVerificationAdvancedStatusTypeormEntity,
      TrainerVerificationStatusHistoryTypeormEntity,
      TrainerVerificationAuditEventTypeormEntity,
      UserTypeormEntity,
      ProfileTypeormEntity,
      ExtractedCertificateDataTypeormEntity,
      ExtractedIdDataTypeormEntity,
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
      provide: TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
      useClass: TypeormTrainerVerificationAuditRepository,
    },
    {
      provide: SPECIALTY_CATALOG_REPOSITORY_PORT,
      useClass: TypeormSpecialtyCatalogRepository,
    },
    {
      provide: DOCUMENT_EXTRACTION_PORT,
      useFactory: (configService: ConfigService) => {
        const enabled = configService.get<string>(
          'AZURE_DOCUMENT_INTELLIGENCE_ENABLED',
          'false',
        );
        if (enabled.toLowerCase() === 'true') {
          return new AzureDocumentIntelligenceService(configService);
        }
        return new FakeDocumentExtractionService();
      },
      inject: [ConfigService],
    },
    TrainerVerificationStateMachineService,
    InMemoryCommandBus,
    InMemoryEventBus,
    SubmitTrainerVerificationUseCase,
    GetMyVerificationStatusUseCase,
    UpdateTrainerVerificationUseCase,
    ListPendingVerificationsUseCase,
    GetVerificationDetailUseCase,
    ReviewTrainerVerificationUseCase,
    ListSpecialtyCatalogUseCase,
    TrainerVerifiedGuard,
    SpecialtyCatalogSeeder,
    CreatePowerspikeDraftUseCase,
    UploadPowerspikeCertificateUseCase,
    UploadPowerspikeIdDocumentUseCase,
    SubmitPowerspikeVerificationUseCase,
    ExtractCertificateHandler,
    ExtractIdDocumentHandler,
    OnCertificateExtractedHandler,
    OnCertificateExtractionFailedHandler,
    OnIdDocumentExtractedHandler,
    OnIdDocumentExtractionFailedHandler,
  ],
  exports: [TRAINER_VERIFICATION_REPOSITORY_PORT, TrainerVerifiedGuard],
})
export class TrainerVerificationModule implements OnModuleInit {
  constructor(
    private readonly commandBus: InMemoryCommandBus,
    private readonly eventBus: InMemoryEventBus,
    private readonly extractCertificateHandler: ExtractCertificateHandler,
    private readonly extractIdDocumentHandler: ExtractIdDocumentHandler,
    private readonly onCertificateExtracted: OnCertificateExtractedHandler,
    private readonly onCertificateExtractionFailed: OnCertificateExtractionFailedHandler,
    private readonly onIdDocumentExtracted: OnIdDocumentExtractedHandler,
    private readonly onIdDocumentExtractionFailed: OnIdDocumentExtractionFailedHandler,
  ) {}

  onModuleInit() {
    this.commandBus.register('ExtractCertificateCommand', (cmd) =>
      this.extractCertificateHandler.handle(cmd),
    );
    this.commandBus.register('ExtractIdDocumentCommand', (cmd) =>
      this.extractIdDocumentHandler.handle(cmd),
    );

    this.eventBus.on('CertificateExtractedEvent', (evt) =>
      this.onCertificateExtracted.handle(evt),
    );
    this.eventBus.on('CertificateExtractionFailedEvent', (evt) =>
      this.onCertificateExtractionFailed.handle(evt),
    );
    this.eventBus.on('IdDocumentExtractedEvent', (evt) =>
      this.onIdDocumentExtracted.handle(evt),
    );
    this.eventBus.on('IdDocumentExtractionFailedEvent', (evt) =>
      this.onIdDocumentExtractionFailed.handle(evt),
    );
  }
}

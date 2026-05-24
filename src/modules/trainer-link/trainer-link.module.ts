import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { TrainerVerificationModule } from '../trainer-verification/trainer-verification.module';
import { TrainingModule } from '../training/training.module';
import { TrainingRemindersInfrastructureModule } from '../training-reminders/infrastructure/providers/training-reminders-infrastructure.module';
import { TRAINER_LINK_REQUEST_REPOSITORY_PORT } from './domain/repositories/trainer-link-request.repository.port';
import { TRAINER_LINK_REPOSITORY_PORT } from './domain/repositories/trainer-link.repository.port';
import { TRAINER_SEARCH_REPOSITORY_PORT } from './domain/repositories/trainer-search.repository.port';
import { LINK_CONFIG_PORT } from './application/ports/link-config.port';
import { SendLinkRequestUseCase } from './application/use-cases/send-link-request/send-link-request.use-case';
import { CancelLinkRequestUseCase } from './application/use-cases/cancel-link-request/cancel-link-request.use-case';
import { ListSentLinkRequestsUseCase } from './application/use-cases/list-sent-link-requests/list-sent-link-requests.use-case';
import { ListReceivedLinkRequestsUseCase } from './application/use-cases/list-received-link-requests/list-received-link-requests.use-case';
import { AcceptLinkRequestUseCase } from './application/use-cases/accept-link-request/accept-link-request.use-case';
import { RejectLinkRequestUseCase } from './application/use-cases/reject-link-request/reject-link-request.use-case';
import { GetActiveLinksUseCase } from './application/use-cases/get-active-links/get-active-links.use-case';
import { GetMyTrainerUseCase } from './application/use-cases/get-my-trainer/get-my-trainer.use-case';
import { DeactivateLinkUseCase } from './application/use-cases/deactivate-link/deactivate-link.use-case';
import { GetClientGeneralInfoUseCase } from './application/use-cases/get-client-general-info/get-client-general-info.use-case';
import { GetRecentSessionsUseCase } from './application/use-cases/get-recent-sessions/get-recent-sessions.use-case';
import { GetBasicIndicatorsUseCase } from './application/use-cases/get-basic-indicators/get-basic-indicators.use-case';
import { GetClientProgressUseCase } from './application/use-cases/get-client-progress/get-client-progress.use-case';
import { GetClientExerciseProgressUseCase } from './application/use-cases/get-client-exercise-progress/get-client-exercise-progress.use-case';
import { SearchTrainersUseCase } from './application/use-cases/search-trainers/search-trainers.use-case';
import { GetPublicTrainerProfileUseCase } from './application/use-cases/get-public-trainer-profile/get-public-trainer-profile.use-case';
import { EnvLinkConfigService } from './infrastructure/config/env-link-config.service';
import { TypeormTrainerLinkRequestRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-trainer-link-request.repository';
import { TypeormTrainerLinkRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-trainer-link.repository';
import { TypeormTrainerSearchRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-trainer-search.repository';
import { TrainerLinkRequestTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-link-request-typeorm.entity';
import { TrainerLinkTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-link-typeorm.entity';
import { UserTypeormEntity } from '../users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { TrainerLinkRequestController } from './presentation/http/controllers/trainer-link-request.controller';
import {
  TrainerLinkController,
  TrainerClientsController,
} from './presentation/http/controllers/trainer-link.controller';
import { TrainerSearchController } from './presentation/http/controllers/trainer-search.controller';
import { ClientGuard } from './presentation/http/guards/client.guard';
import { TrainerLinkErrorFilter } from './presentation/http/filters/trainer-link-error.filter';

@Module({
  imports: [
    UsersModule,
    TrainerVerificationModule,
    TrainingModule,
    TrainingRemindersInfrastructureModule,
    TypeOrmModule.forFeature([
      TrainerLinkRequestTypeormEntity,
      TrainerLinkTypeormEntity,
      UserTypeormEntity,
    ]),
  ],
  controllers: [
    TrainerLinkRequestController,
    TrainerLinkController,
    TrainerClientsController,
    TrainerSearchController,
  ],
  providers: [
    {
      provide: TRAINER_LINK_REQUEST_REPOSITORY_PORT,
      useClass: TypeormTrainerLinkRequestRepository,
    },
    {
      provide: TRAINER_LINK_REPOSITORY_PORT,
      useClass: TypeormTrainerLinkRepository,
    },
    {
      provide: TRAINER_SEARCH_REPOSITORY_PORT,
      useClass: TypeormTrainerSearchRepository,
    },
    {
      provide: LINK_CONFIG_PORT,
      useClass: EnvLinkConfigService,
    },
    SendLinkRequestUseCase,
    CancelLinkRequestUseCase,
    ListSentLinkRequestsUseCase,
    ListReceivedLinkRequestsUseCase,
    AcceptLinkRequestUseCase,
    RejectLinkRequestUseCase,
    GetActiveLinksUseCase,
    GetMyTrainerUseCase,
    DeactivateLinkUseCase,
    GetClientGeneralInfoUseCase,
    GetRecentSessionsUseCase,
    GetBasicIndicatorsUseCase,
    GetClientProgressUseCase,
    GetClientExerciseProgressUseCase,
    SearchTrainersUseCase,
    GetPublicTrainerProfileUseCase,
    ClientGuard,
    TrainerLinkErrorFilter,
  ],
  exports: [
    TRAINER_LINK_REQUEST_REPOSITORY_PORT,
    TRAINER_LINK_REPOSITORY_PORT,
    TRAINER_SEARCH_REPOSITORY_PORT,
  ],
})
export class TrainerLinkModule {}

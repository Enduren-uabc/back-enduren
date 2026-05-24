import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerVerificationModule } from '../trainer-verification/trainer-verification.module';
import { TrainerLinkModule } from '../trainer-link/trainer-link.module';
import { TrainingModule } from '../training/training.module';
import { TrainingRemindersInfrastructureModule } from '../training-reminders/infrastructure/providers/training-reminders-infrastructure.module';
import { TrainerAssignedRoutineTypeormEntity } from './infrastructure/persistence/typeorm/entities/trainer-assigned-routine-typeorm.entity';
import { TypeormTrainerAssignedRoutineRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-trainer-assigned-routine.repository';
import { TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT } from './domain/repositories/trainer-assigned-routine.repository.port';
import { ActiveLinkGuard } from './infrastructure/guards/active-link.guard';
import { GetAssignableRoutinesUseCase } from './application/use-cases/get-assignable-routines/get-assignable-routines.use-case';
import { AssignRoutineToClientUseCase } from './application/use-cases/assign-routine-to-client/assign-routine-to-client.use-case';
import { GetClientAssignedRoutinesUseCase } from './application/use-cases/get-client-assigned-routines/get-client-assigned-routines.use-case';
import { GetMyAssignedRoutinesUseCase } from './application/use-cases/get-my-assigned-routines/get-my-assigned-routines.use-case';
import { ReplaceAssignedRoutineUseCase } from './application/use-cases/replace-assigned-routine/replace-assigned-routine.use-case';
import { UpdateAssignedRoutineNotesUseCase } from './application/use-cases/update-assigned-routine-notes/update-assigned-routine-notes.use-case';
import { GetAssignedRoutineDetailUseCase } from './application/use-cases/get-assigned-routine-detail/get-assigned-routine-detail.use-case';
import { EditAssignedRoutineContentUseCase } from './application/use-cases/edit-assigned-routine-content/edit-assigned-routine-content.use-case';
import {
  TrainerPanelController,
  ClientAssignedRoutineController,
} from './presentation/http/controllers/trainer-panel.controller';

@Module({
  imports: [
    TrainerVerificationModule,
    TrainerLinkModule,
    TrainingModule,
    TrainingRemindersInfrastructureModule,
    TypeOrmModule.forFeature([TrainerAssignedRoutineTypeormEntity]),
  ],
  controllers: [TrainerPanelController, ClientAssignedRoutineController],
  providers: [
    {
      provide: TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT,
      useClass: TypeormTrainerAssignedRoutineRepository,
    },
    ActiveLinkGuard,
    GetAssignableRoutinesUseCase,
    AssignRoutineToClientUseCase,
    GetClientAssignedRoutinesUseCase,
    GetMyAssignedRoutinesUseCase,
    ReplaceAssignedRoutineUseCase,
    UpdateAssignedRoutineNotesUseCase,
    GetAssignedRoutineDetailUseCase,
    EditAssignedRoutineContentUseCase,
  ],
  exports: [TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT],
})
export class TrainerPanelModule {}

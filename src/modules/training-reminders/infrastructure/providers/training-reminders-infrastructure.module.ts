import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingReminderTypeormEntity } from '../persistence/typeorm/entities/training-reminder-typeorm.entity';
import { TypeormTrainingReminderRepository } from '../persistence/typeorm/repositories/typeorm-training-reminder.repository';
import { TRAINING_REMINDER_REPOSITORY_PORT } from '../../domain/repositories/training-reminder.repository.port';
import { ROUTINE_REPOSITORY_PORT } from '../../application/use-cases/create-reminder/create-reminder.use-case';
import { TypeormRoutineRepository } from '../../../../modules/training/infrastructure/persistence/typeorm/repositories/typeorm-routine.repository';
import { RoutineTypeormEntity } from '../../../../modules/training/infrastructure/persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../../../../modules/training/infrastructure/persistence/typeorm/entities/routine-day-typeorm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingReminderTypeormEntity,
      RoutineTypeormEntity,
      RoutineDayTypeormEntity,
    ]),
  ],
  providers: [
    {
      provide: TRAINING_REMINDER_REPOSITORY_PORT,
      useClass: TypeormTrainingReminderRepository,
    },
    {
      provide: ROUTINE_REPOSITORY_PORT,
      useClass: TypeormRoutineRepository,
    },
  ],
  exports: [
    TRAINING_REMINDER_REPOSITORY_PORT,
    ROUTINE_REPOSITORY_PORT,
  ],
})
export class TrainingRemindersInfrastructureModule {}

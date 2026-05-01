import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutineTypeormEntity } from '../persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../persistence/typeorm/entities/exercise-typeorm.entity';
import { TypeormRoutineRepository } from '../persistence/typeorm/repositories/typeorm-routine.repository';
import {
  ROUTINE_REPOSITORY_PORT,
  CURRENT_ACTOR_PORT,
} from '../../application/use-cases/create-routine/create-routine.use-case';
import { DevActorService } from './current-actor.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoutineTypeormEntity,
      RoutineDayTypeormEntity,
      ExerciseTypeormEntity,
    ]),
  ],
  providers: [
    {
      provide: ROUTINE_REPOSITORY_PORT,
      useClass: TypeormRoutineRepository,
    },
    {
      provide: CURRENT_ACTOR_PORT,
      useClass: DevActorService,
    },
  ],
  exports: [ROUTINE_REPOSITORY_PORT, CURRENT_ACTOR_PORT],
})
export class TrainingInfrastructureModule {}

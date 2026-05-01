import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutineTypeormEntity } from '../persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../persistence/typeorm/entities/exercise-typeorm.entity';
import { WorkoutSessionTypeormEntity } from '../persistence/typeorm/entities/workout-session-typeorm.entity';
import { WorkoutSessionExerciseTypeormEntity } from '../persistence/typeorm/entities/workout-session-exercise-typeorm.entity';
import { WorkoutSessionSetTypeormEntity } from '../persistence/typeorm/entities/workout-session-set-typeorm.entity';
import { TypeormRoutineRepository } from '../persistence/typeorm/repositories/typeorm-routine.repository';
import { TypeormWorkoutSessionRepository } from '../persistence/typeorm/repositories/typeorm-workout-session.repository';
import {
  ROUTINE_REPOSITORY_PORT,
  CURRENT_ACTOR_PORT,
} from '../../application/use-cases/create-routine/create-routine.use-case';
import { WORKOUT_SESSION_REPOSITORY_PORT } from '../../application/use-cases/start-workout-session/start-workout-session.use-case';
import { ROUTINE_REPOSITORY_PORT_FOR_SESSION } from '../../application/use-cases/start-workout-session/start-workout-session.use-case';
import { DevActorService } from './current-actor.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoutineTypeormEntity,
      RoutineDayTypeormEntity,
      ExerciseTypeormEntity,
      WorkoutSessionTypeormEntity,
      WorkoutSessionExerciseTypeormEntity,
      WorkoutSessionSetTypeormEntity,
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
    {
      provide: WORKOUT_SESSION_REPOSITORY_PORT,
      useClass: TypeormWorkoutSessionRepository,
    },
    {
      provide: ROUTINE_REPOSITORY_PORT_FOR_SESSION,
      useClass: TypeormRoutineRepository,
    },
  ],
  exports: [
    ROUTINE_REPOSITORY_PORT,
    CURRENT_ACTOR_PORT,
    WORKOUT_SESSION_REPOSITORY_PORT,
    ROUTINE_REPOSITORY_PORT_FOR_SESSION,
  ],
})
export class TrainingInfrastructureModule {}

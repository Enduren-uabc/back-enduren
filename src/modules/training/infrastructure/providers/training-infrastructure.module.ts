import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileModule } from '../../../profile/profile.module';
import { PROFILE_REPOSITORY_PORT } from '../../../profile/domain/repositories/profile.repository';
import { RoutineTypeormEntity } from '../persistence/typeorm/entities/routine-typeorm.entity';
import { RoutineDayTypeormEntity } from '../persistence/typeorm/entities/routine-day-typeorm.entity';
import { ExerciseTypeormEntity } from '../persistence/typeorm/entities/exercise-typeorm.entity';
import { ExerciseSetTypeormEntity } from '../persistence/typeorm/entities/exercise-set-typeorm.entity';
import { WorkoutSessionTypeormEntity } from '../persistence/typeorm/entities/workout-session-typeorm.entity';
import { WorkoutSessionExerciseTypeormEntity } from '../persistence/typeorm/entities/workout-session-exercise-typeorm.entity';
import { WorkoutSessionSetTypeormEntity } from '../persistence/typeorm/entities/workout-session-set-typeorm.entity';
import { ExerciseCatalogTypeormEntity } from '../persistence/typeorm/entities/exercise-catalog-typeorm.entity';
import { TrainingStrategyTypeormEntity } from '../persistence/typeorm/entities/training-strategy-typeorm.entity';
import { TypeormRoutineRepository } from '../persistence/typeorm/repositories/typeorm-routine.repository';
import { TypeormWorkoutSessionRepository } from '../persistence/typeorm/repositories/typeorm-workout-session.repository';
import { TypeormExerciseCatalogRepository } from '../persistence/typeorm/repositories/typeorm-exercise-catalog.repository';
import { TypeormTrainingStrategyRepository } from '../persistence/typeorm/repositories/typeorm-training-strategy.repository';
import { ROUTINE_REPOSITORY_PORT } from '../../application/use-cases/create-routine/create-routine.use-case';
import { WORKOUT_SESSION_REPOSITORY_PORT } from '../../application/use-cases/start-workout-session/start-workout-session.use-case';
import { ROUTINE_REPOSITORY_PORT_FOR_SESSION } from '../../application/use-cases/start-workout-session/start-workout-session.use-case';
import { EXERCISE_CATALOG_REPOSITORY_PORT } from '../../application/use-cases/list-exercise-catalog/list-exercise-catalog.use-case';
import { TRAINING_STRATEGY_REPOSITORY_PORT } from '../../application/use-cases/list-training-strategies/list-training-strategies.use-case';
import { PROFILE_QUERY_PORT, ProfileQueryAdapter } from '../adapters/profile-query.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoutineTypeormEntity,
      RoutineDayTypeormEntity,
      ExerciseTypeormEntity,
      ExerciseSetTypeormEntity,
      WorkoutSessionTypeormEntity,
      WorkoutSessionExerciseTypeormEntity,
      WorkoutSessionSetTypeormEntity,
      ExerciseCatalogTypeormEntity,
      TrainingStrategyTypeormEntity,
    ]),
    ProfileModule,
  ],
  providers: [
    {
      provide: ROUTINE_REPOSITORY_PORT,
      useClass: TypeormRoutineRepository,
    },
    {
      provide: WORKOUT_SESSION_REPOSITORY_PORT,
      useClass: TypeormWorkoutSessionRepository,
    },
    {
      provide: ROUTINE_REPOSITORY_PORT_FOR_SESSION,
      useClass: TypeormRoutineRepository,
    },
    {
      provide: EXERCISE_CATALOG_REPOSITORY_PORT,
      useClass: TypeormExerciseCatalogRepository,
    },
    {
      provide: TRAINING_STRATEGY_REPOSITORY_PORT,
      useClass: TypeormTrainingStrategyRepository,
    },
    {
      provide: PROFILE_QUERY_PORT,
      useClass: ProfileQueryAdapter,
    },
  ],
  exports: [
    ROUTINE_REPOSITORY_PORT,
    WORKOUT_SESSION_REPOSITORY_PORT,
    ROUTINE_REPOSITORY_PORT_FOR_SESSION,
    EXERCISE_CATALOG_REPOSITORY_PORT,
    TRAINING_STRATEGY_REPOSITORY_PORT,
    PROFILE_QUERY_PORT,
  ],
})
export class TrainingInfrastructureModule {}

import { Module } from '@nestjs/common';
import { RoutineController } from './controllers/routine.controller';
import { WorkoutSessionController } from './controllers/workout-session.controller';
import { ExerciseCatalogController } from './controllers/exercise-catalog.controller';
import { TrainingStrategyController } from './controllers/training-strategy.controller';
import { TrainingApplicationModule } from '../../application/training-application.module';

@Module({
  imports: [TrainingApplicationModule],
  controllers: [
    RoutineController,
    WorkoutSessionController,
    ExerciseCatalogController,
    TrainingStrategyController,
  ],
})
export class TrainingPresentationModule {}

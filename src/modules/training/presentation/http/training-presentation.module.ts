import { Module } from '@nestjs/common';
import { RoutineController } from './controllers/routine.controller';
import { WorkoutSessionController } from './controllers/workout-session.controller';
import { ExerciseCatalogController } from './controllers/exercise-catalog.controller';
import { TrainingInfrastructureModule } from '../../infrastructure/providers/training-infrastructure.module';

@Module({
  imports: [TrainingInfrastructureModule],
  controllers: [
    RoutineController,
    WorkoutSessionController,
    ExerciseCatalogController,
  ],
})
export class TrainingPresentationModule {}

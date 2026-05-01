import { Module } from '@nestjs/common';
import { RoutineController } from './controllers/routine.controller';
import { WorkoutSessionController } from './controllers/workout-session.controller';
import { TrainingInfrastructureModule } from '../../infrastructure/providers/training-infrastructure.module';

@Module({
  imports: [TrainingInfrastructureModule],
  controllers: [RoutineController, WorkoutSessionController],
})
export class TrainingPresentationModule {}

import { Module } from '@nestjs/common';
import { RoutineController } from './controllers/routine.controller';
import { WorkoutSessionController } from './controllers/workout-session.controller';

@Module({
  controllers: [RoutineController, WorkoutSessionController],
})
export class TrainingPresentationModule {}

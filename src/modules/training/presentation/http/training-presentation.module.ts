import { Module } from '@nestjs/common';
import { RoutineController } from './controllers/routine.controller';

@Module({
  controllers: [RoutineController],
})
export class TrainingPresentationModule {}

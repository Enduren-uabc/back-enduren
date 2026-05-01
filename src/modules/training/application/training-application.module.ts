import { Module } from '@nestjs/common';
import { CreateRoutineUseCase } from './use-cases/create-routine/create-routine.use-case';

@Module({
  providers: [CreateRoutineUseCase],
  exports: [CreateRoutineUseCase],
})
export class TrainingApplicationModule {}

import { Module } from '@nestjs/common';
import { CreateRoutineUseCase } from './use-cases/create-routine/create-routine.use-case';
import { StartWorkoutSessionUseCase } from './use-cases/start-workout-session/start-workout-session.use-case';
import { FinishWorkoutSessionUseCase } from './use-cases/finish-workout-session/finish-workout-session.use-case';
import { ResumeWorkoutSessionUseCase } from './use-cases/resume-workout-session/resume-workout-session.use-case';
import { GetWorkoutSessionUseCase } from './use-cases/get-workout-session/get-workout-session.use-case';

@Module({
  providers: [
    CreateRoutineUseCase,
    StartWorkoutSessionUseCase,
    FinishWorkoutSessionUseCase,
    ResumeWorkoutSessionUseCase,
    GetWorkoutSessionUseCase,
  ],
  exports: [
    CreateRoutineUseCase,
    StartWorkoutSessionUseCase,
    FinishWorkoutSessionUseCase,
    ResumeWorkoutSessionUseCase,
    GetWorkoutSessionUseCase,
  ],
})
export class TrainingApplicationModule {}

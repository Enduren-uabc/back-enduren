import { Module } from '@nestjs/common';
import { CreateRoutineUseCase } from './use-cases/create-routine/create-routine.use-case';
import { StartWorkoutSessionUseCase } from './use-cases/start-workout-session/start-workout-session.use-case';
import { FinishWorkoutSessionUseCase } from './use-cases/finish-workout-session/finish-workout-session.use-case';
import { ResumeWorkoutSessionUseCase } from './use-cases/resume-workout-session/resume-workout-session.use-case';
import { GetWorkoutSessionUseCase } from './use-cases/get-workout-session/get-workout-session.use-case';
import { RegisterSetRepsAndWeightUseCase } from './use-cases/register-set-reps-and-weight/register-set-reps-and-weight.use-case';
import { MarkSetAsCompletedUseCase } from './use-cases/mark-set-as-completed/mark-set-as-completed.use-case';
import { AdvanceToNextExerciseUseCase } from './use-cases/advance-to-next-exercise/advance-to-next-exercise.use-case';
import { GetWorkoutSessionHistoryUseCase } from './use-cases/get-workout-session-history/get-workout-session-history.use-case';
import { GetWorkoutSessionDetailUseCase } from './use-cases/get-workout-session-detail/get-workout-session-detail.use-case';
import { GetExerciseProgressUseCase } from './use-cases/get-exercise-progress/get-exercise-progress.use-case';

@Module({
  providers: [
    CreateRoutineUseCase,
    StartWorkoutSessionUseCase,
    FinishWorkoutSessionUseCase,
    ResumeWorkoutSessionUseCase,
    GetWorkoutSessionUseCase,
    RegisterSetRepsAndWeightUseCase,
    MarkSetAsCompletedUseCase,
    AdvanceToNextExerciseUseCase,
    GetWorkoutSessionHistoryUseCase,
    GetWorkoutSessionDetailUseCase,
    GetExerciseProgressUseCase,
  ],
  exports: [
    CreateRoutineUseCase,
    StartWorkoutSessionUseCase,
    FinishWorkoutSessionUseCase,
    ResumeWorkoutSessionUseCase,
    GetWorkoutSessionUseCase,
    RegisterSetRepsAndWeightUseCase,
    MarkSetAsCompletedUseCase,
    AdvanceToNextExerciseUseCase,
    GetWorkoutSessionHistoryUseCase,
    GetWorkoutSessionDetailUseCase,
    GetExerciseProgressUseCase,
  ],
})
export class TrainingApplicationModule {}

import { Module } from '@nestjs/common';
import { TrainingInfrastructureModule } from '../infrastructure/providers/training-infrastructure.module';
import {
  CreateRoutineUseCase,
  ROUTINE_REPOSITORY_PORT,
} from './use-cases/create-routine/create-routine.use-case';
import { AddExerciseToRoutineDayUseCase } from './use-cases/add-exercise-to-routine-day/add-exercise-to-routine-day.use-case';
import { RemoveExerciseFromRoutineUseCase } from './use-cases/remove-exercise-from-routine/remove-exercise-from-routine.use-case';
import { ConfigureExerciseUseCase } from './use-cases/configure-exercise/configure-exercise.use-case';
import { ActivateRoutineUseCase } from './use-cases/activate-routine/activate-routine.use-case';
import { DeactivateRoutineUseCase } from './use-cases/deactivate-routine/deactivate-routine.use-case';
import { ListRoutinesUseCase } from './use-cases/list-routines/list-routines.use-case';
import { GetRoutineDetailUseCase } from './use-cases/get-routine-detail/get-routine-detail.use-case';
import { DeleteRoutineUseCase } from './use-cases/delete-routine/delete-routine.use-case';
import { SyncRoutineUseCase } from './use-cases/sync-routine/sync-routine.use-case';
import { SetRoutineTrainingStrategyUseCase } from './use-cases/set-routine-training-strategy/set-routine-training-strategy.use-case';
import { GenerateExerciseSetsUseCase } from './use-cases/generate-exercise-sets/generate-exercise-sets.use-case';
import {
  StartWorkoutSessionUseCase,
  WORKOUT_SESSION_REPOSITORY_PORT,
  ROUTINE_REPOSITORY_PORT_FOR_SESSION,
} from './use-cases/start-workout-session/start-workout-session.use-case';
import { FinishWorkoutSessionUseCase } from './use-cases/finish-workout-session/finish-workout-session.use-case';
import { ResumeWorkoutSessionUseCase } from './use-cases/resume-workout-session/resume-workout-session.use-case';
import { GetWorkoutSessionUseCase } from './use-cases/get-workout-session/get-workout-session.use-case';
import { RegisterSetRepsAndWeightUseCase } from './use-cases/register-set-reps-and-weight/register-set-reps-and-weight.use-case';
import { MarkSetAsCompletedUseCase } from './use-cases/mark-set-as-completed/mark-set-as-completed.use-case';
import { AdvanceToNextExerciseUseCase } from './use-cases/advance-to-next-exercise/advance-to-next-exercise.use-case';
import { GetWorkoutSessionHistoryUseCase } from './use-cases/get-workout-session-history/get-workout-session-history.use-case';
import { GetWorkoutSessionDetailUseCase } from './use-cases/get-workout-session-detail/get-workout-session-detail.use-case';
import { GetExerciseProgressUseCase } from './use-cases/get-exercise-progress/get-exercise-progress.use-case';
import { AddSetToExerciseUseCase } from './use-cases/add-set-to-exercise/add-set-to-exercise.use-case';
import { RemoveSetFromExerciseUseCase } from './use-cases/remove-set-from-exercise/remove-set-from-exercise.use-case';
import { DiscardWorkoutSessionUseCase } from './use-cases/discard-workout-session/discard-workout-session.use-case';
import {
  ListExerciseCatalogUseCase,
  EXERCISE_CATALOG_REPOSITORY_PORT,
} from './use-cases/list-exercise-catalog/list-exercise-catalog.use-case';
import {
  ListTrainingStrategiesUseCase,
  TRAINING_STRATEGY_REPOSITORY_PORT,
} from './use-cases/list-training-strategies/list-training-strategies.use-case';

const routineUseCaseProviders = [
  {
    provide: CreateRoutineUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new CreateRoutineUseCase(routineRepository),
  },
  {
    provide: AddExerciseToRoutineDayUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new AddExerciseToRoutineDayUseCase(routineRepository),
  },
  {
    provide: RemoveExerciseFromRoutineUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new RemoveExerciseFromRoutineUseCase(routineRepository),
  },
  {
    provide: ConfigureExerciseUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new ConfigureExerciseUseCase(routineRepository),
  },
  {
    provide: ActivateRoutineUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new ActivateRoutineUseCase(routineRepository),
  },
  {
    provide: DeactivateRoutineUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new DeactivateRoutineUseCase(routineRepository),
  },
  {
    provide: ListRoutinesUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new ListRoutinesUseCase(routineRepository),
  },
  {
    provide: GetRoutineDetailUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new GetRoutineDetailUseCase(routineRepository),
  },
  {
    provide: DeleteRoutineUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new DeleteRoutineUseCase(routineRepository),
  },
  {
    provide: SyncRoutineUseCase,
    inject: [ROUTINE_REPOSITORY_PORT],
    useFactory: (routineRepository) =>
      new SyncRoutineUseCase(routineRepository),
  },
  {
    provide: SetRoutineTrainingStrategyUseCase,
    inject: [ROUTINE_REPOSITORY_PORT, TRAINING_STRATEGY_REPOSITORY_PORT],
    useFactory: (routineRepository, trainingStrategyRepository) =>
      new SetRoutineTrainingStrategyUseCase(
        routineRepository,
        trainingStrategyRepository,
      ),
  },
  {
    provide: GenerateExerciseSetsUseCase,
    inject: [TRAINING_STRATEGY_REPOSITORY_PORT],
    useFactory: (trainingStrategyRepository) =>
      new GenerateExerciseSetsUseCase(trainingStrategyRepository),
  },
];

const workoutSessionUseCaseProviders = [
  {
    provide: StartWorkoutSessionUseCase,
    inject: [
      WORKOUT_SESSION_REPOSITORY_PORT,
      ROUTINE_REPOSITORY_PORT_FOR_SESSION,
    ],
    useFactory: (workoutSessionRepository, routineRepository) =>
      new StartWorkoutSessionUseCase(
        workoutSessionRepository,
        routineRepository,
      ),
  },
  {
    provide: FinishWorkoutSessionUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new FinishWorkoutSessionUseCase(workoutSessionRepository),
  },
  {
    provide: ResumeWorkoutSessionUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new ResumeWorkoutSessionUseCase(workoutSessionRepository),
  },
  {
    provide: GetWorkoutSessionUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new GetWorkoutSessionUseCase(workoutSessionRepository),
  },
  {
    provide: RegisterSetRepsAndWeightUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new RegisterSetRepsAndWeightUseCase(workoutSessionRepository),
  },
  {
    provide: MarkSetAsCompletedUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new MarkSetAsCompletedUseCase(workoutSessionRepository),
  },
  {
    provide: AdvanceToNextExerciseUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new AdvanceToNextExerciseUseCase(workoutSessionRepository),
  },
  {
    provide: GetWorkoutSessionHistoryUseCase,
    inject: [
      WORKOUT_SESSION_REPOSITORY_PORT,
      ROUTINE_REPOSITORY_PORT_FOR_SESSION,
    ],
    useFactory: (workoutSessionRepository, routineRepository) =>
      new GetWorkoutSessionHistoryUseCase(
        workoutSessionRepository,
        routineRepository,
      ),
  },
  {
    provide: GetWorkoutSessionDetailUseCase,
    inject: [
      WORKOUT_SESSION_REPOSITORY_PORT,
      ROUTINE_REPOSITORY_PORT_FOR_SESSION,
    ],
    useFactory: (workoutSessionRepository, routineRepository) =>
      new GetWorkoutSessionDetailUseCase(
        workoutSessionRepository,
        routineRepository,
      ),
  },
  {
    provide: GetExerciseProgressUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new GetExerciseProgressUseCase(workoutSessionRepository),
  },
  {
    provide: AddSetToExerciseUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new AddSetToExerciseUseCase(workoutSessionRepository),
  },
  {
    provide: RemoveSetFromExerciseUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new RemoveSetFromExerciseUseCase(workoutSessionRepository),
  },
  {
    provide: DiscardWorkoutSessionUseCase,
    inject: [WORKOUT_SESSION_REPOSITORY_PORT],
    useFactory: (workoutSessionRepository) =>
      new DiscardWorkoutSessionUseCase(workoutSessionRepository),
  },
];

const catalogUseCaseProviders = [
  {
    provide: ListExerciseCatalogUseCase,
    inject: [EXERCISE_CATALOG_REPOSITORY_PORT],
    useFactory: (exerciseCatalogRepository) =>
      new ListExerciseCatalogUseCase(exerciseCatalogRepository),
  },
  {
    provide: ListTrainingStrategiesUseCase,
    inject: [TRAINING_STRATEGY_REPOSITORY_PORT],
    useFactory: (trainingStrategyRepository) =>
      new ListTrainingStrategiesUseCase(trainingStrategyRepository),
  },
];

const useCaseProviders = [
  ...routineUseCaseProviders,
  ...workoutSessionUseCaseProviders,
  ...catalogUseCaseProviders,
];

@Module({
  imports: [TrainingInfrastructureModule],
  providers: useCaseProviders,
  exports: useCaseProviders,
})
export class TrainingApplicationModule {}

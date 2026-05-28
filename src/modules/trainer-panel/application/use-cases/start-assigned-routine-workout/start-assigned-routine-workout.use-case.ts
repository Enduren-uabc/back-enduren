import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WorkoutSession } from '../../../../training/domain/entities/workout-session.entity';
import { WorkoutExercise } from '../../../../training/domain/value-objects/workout-exercise.value-object';
import {
  isValidDayOfWeek,
  type DayOfWeek,
} from '../../../../training/domain/value-objects/routine-day.value-object';
import {
  WorkoutSessionDomainError,
  WorkoutSessionErrorCode,
} from '../../../../training/domain/errors/workout-session-domain.error';
import {
  WORKOUT_SESSION_REPOSITORY_PORT,
  type StartWorkoutSessionOutput,
} from '../../../../training/application/use-cases/start-workout-session/start-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../../training/domain/repositories/workout-session.repository.port';
import { mapWorkoutSessionToOutput } from '../../../../training/application/use-cases/workout-session-output.mapper';
import {
  TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT,
  TrainerAssignedRoutineRepositoryPort,
} from '../../../domain/repositories/trainer-assigned-routine.repository.port';

export interface StartAssignedRoutineWorkoutInput {
  clientId: string;
  assignedId: string;
  dayOfWeek?: string;
}

@Injectable()
export class StartAssignedRoutineWorkoutUseCase {
  constructor(
    @Inject(TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT)
    private readonly assignedRoutineRepository: TrainerAssignedRoutineRepositoryPort,
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    private readonly workoutSessionRepository: WorkoutSessionRepository,
  ) {}

  async execute(
    input: StartAssignedRoutineWorkoutInput,
  ): Promise<StartWorkoutSessionOutput> {
    const assigned = await this.assignedRoutineRepository.findById(
      input.assignedId,
    );

    if (!assigned || assigned.clientId !== input.clientId) {
      throw new NotFoundException('Assigned routine not found');
    }

    if (!assigned.status.isActive()) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_NO_ACTIVE_ROUTINE,
        'Assigned routine is not active',
        { assignedId: input.assignedId, status: assigned.status.value },
      );
    }

    const existingSession =
      await this.workoutSessionRepository.findInProgressByUserId(
        input.clientId,
      );
    if (existingSession) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_ALREADY_IN_PROGRESS,
        'User already has a workout session in progress',
        { userId: input.clientId, existingSessionId: existingSession.id },
      );
    }

    const requestedDay = input.dayOfWeek;
    if (requestedDay && !isValidDayOfWeek(requestedDay)) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_DAY_NOT_FOUND,
        `Invalid workout day: ${requestedDay}`,
        { dayOfWeek: requestedDay },
      );
    }

    const day =
      requestedDay != null
        ? assigned.routineSnapshot.days.find(
            (snapshotDay) => snapshotDay.dayOfWeek === requestedDay,
          )
        : assigned.routineSnapshot.days[0];

    if (!day) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_DAY_NOT_FOUND,
        'Assigned routine does not have the requested training day',
        { assignedId: input.assignedId, dayOfWeek: requestedDay ?? null },
      );
    }

    if (day.exercises.length === 0) {
      throw new WorkoutSessionDomainError(
        WorkoutSessionErrorCode.SESSION_DAY_HAS_NO_EXERCISES,
        'Assigned routine day has no exercises',
        { assignedId: input.assignedId, dayOfWeek: day.dayOfWeek },
      );
    }

    const workoutExercises = [...day.exercises]
      .sort((a, b) => a.order - b.order)
      .map((exercise) => {
        const setCount = Math.max(1, exercise.sets);
        const targetSets = Array.from({ length: setCount }, (_, index) => ({
          setNumber: index + 1,
          reps: exercise.reps,
          weight: 0,
        }));

        return WorkoutExercise.create(
          exercise.exerciseId,
          exercise.name,
          exercise.order,
          targetSets,
        );
      });

    const session = WorkoutSession.create(
      crypto.randomUUID(),
      input.clientId,
      assigned.routineId,
      workoutExercises,
      day.dayOfWeek as DayOfWeek,
      'trainer_assigned',
      assigned.id,
    );

    const saved = await this.workoutSessionRepository.save(session);
    return mapWorkoutSessionToOutput(saved);
  }
}

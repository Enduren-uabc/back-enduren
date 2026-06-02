import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../domain/repositories/trainer-link.repository.port';
import { WORKOUT_SESSION_REPOSITORY_PORT } from '../../../../training/application/use-cases/start-workout-session/start-workout-session.use-case';
import { WorkoutSessionRepository } from '../../../../training/domain/repositories/workout-session.repository.port';

export interface ExerciseProgressRecordOutput {
  sessionId: string;
  date: string;
  weightUsed: number;
  repsPerformed: number;
  setsCompleted: number;
  totalSets: number;
}

export interface GetClientExerciseProgressInput {
  trainerId: string;
  clientId: string;
  exerciseId: string;
}

export interface GetClientExerciseProgressOutput {
  sufficientData: boolean;
  exerciseId: string;
  exerciseName: string;
  records: ExerciseProgressRecordOutput[];
  message: string | null;
}

@Injectable()
export class GetClientExerciseProgressUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(WORKOUT_SESSION_REPOSITORY_PORT)
    private readonly sessionRepository: WorkoutSessionRepository,
  ) {}

  async execute(
    input: GetClientExerciseProgressInput,
  ): Promise<GetClientExerciseProgressOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const sessions =
      await this.sessionRepository.findFinishedByUserIdAndExerciseId(
        input.clientId,
        input.exerciseId,
      );

    if (sessions.length === 0) {
      return {
        sufficientData: false,
        exerciseId: input.exerciseId,
        exerciseName: 'Unknown Exercise',
        records: [],
        message:
          'Insufficient data for progress comparison. At least 2 records are required.',
      };
    }

    const exerciseName = this.resolveExerciseName(sessions, input.exerciseId);

    if (sessions.length < 2) {
      return {
        sufficientData: false,
        exerciseId: input.exerciseId,
        exerciseName,
        records: [],
        message:
          'Insufficient data for progress comparison. At least 2 records are required.',
      };
    }

    const records: ExerciseProgressRecordOutput[] = sessions.map((session) => {
      const exercise = session.exercises.find(
        (ex) => ex.exerciseId === input.exerciseId,
      );

      const completedSets = exercise!.workoutSets.filter((ws) => ws.completed);
      const weightUsed =
        completedSets.length > 0
          ? Math.max(...completedSets.map((ws) => ws.weightUsed ?? 0))
          : 0;
      const repsPerformed = completedSets.reduce(
        (sum, ws) => sum + (ws.repsPerformed ?? 0),
        0,
      );
      const setsCompleted = completedSets.length;
      const totalSets = exercise!.targetSets.length;

      return {
        sessionId: session.id,
        date: session.startedAt.toISOString(),
        weightUsed,
        repsPerformed,
        setsCompleted,
        totalSets,
      };
    });

    return {
      sufficientData: true,
      exerciseId: input.exerciseId,
      exerciseName,
      records,
      message: null,
    };
  }

  private resolveExerciseName(
    sessions: Array<{
      exercises: Array<{ exerciseId: string; exerciseName: string }>;
    }>,
    exerciseId: string,
  ): string {
    for (const session of sessions) {
      const exercise = session.exercises.find(
        (ex) => ex.exerciseId === exerciseId,
      );
      if (exercise) {
        return exercise.exerciseName;
      }
    }
    return 'Unknown Exercise';
  }
}

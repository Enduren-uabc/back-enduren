import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../../trainer-link/domain/repositories/trainer-link.repository.port';
import {
  TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT,
  TrainerAssignedRoutineRepositoryPort,
} from '../../../domain/repositories/trainer-assigned-routine.repository.port';

export interface GetAssignedRoutineDetailInput {
  trainerId: string;
  clientId: string;
  assignedId: string;
}

export interface ExerciseDetailItem {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  order: number;
}

export interface DayDetailItem {
  dayOfWeek: string;
  exercises: ExerciseDetailItem[];
}

export interface GetAssignedRoutineDetailOutput {
  id: string;
  routineId: string;
  routineName: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  status: string;
  assignedAt: Date;
  notes: string | null;
  originLabel: string;
  days: DayDetailItem[];
}

@Injectable()
export class GetAssignedRoutineDetailUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT)
    private readonly assignedRoutineRepository: TrainerAssignedRoutineRepositoryPort,
  ) {}

  async execute(
    input: GetAssignedRoutineDetailInput,
  ): Promise<GetAssignedRoutineDetailOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const assigned = await this.assignedRoutineRepository.findById(
      input.assignedId,
    );
    if (!assigned) {
      throw new NotFoundException('Assigned routine not found');
    }

    if (
      assigned.trainerId !== input.trainerId ||
      assigned.clientId !== input.clientId
    ) {
      throw new ForbiddenException(
        'Assigned routine does not belong to this trainer-client pair',
      );
    }

    let days: DayDetailItem[];
    if (assigned.routineSnapshot.days.length > 0) {
      days = assigned.routineSnapshot.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        exercises: d.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          restSeconds: e.restSeconds,
          order: e.order,
        })),
      }));
    } else if (assigned.routineSnapshot.exercises.length > 0) {
      days = [
        {
          dayOfWeek: 'general',
          exercises: assigned.routineSnapshot.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            restSeconds: e.restSeconds,
            order: e.order,
          })),
        },
      ];
    } else {
      days = [];
    }

    return {
      id: assigned.id,
      routineId: assigned.routineId,
      routineName: assigned.routineSnapshot.name,
      description: assigned.routineSnapshot.description,
      difficulty: assigned.routineSnapshot.difficulty,
      estimatedDuration: assigned.routineSnapshot.estimatedDuration,
      status: assigned.status.value,
      assignedAt: assigned.assignedAt,
      notes: assigned.notes,
      originLabel: 'Asignada por entrenador',
      days,
    };
  }
}

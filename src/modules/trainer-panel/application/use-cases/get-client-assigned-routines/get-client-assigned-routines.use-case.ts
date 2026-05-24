import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../../trainer-link/domain/repositories/trainer-link.repository.port';
import {
  TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT,
  TrainerAssignedRoutineRepositoryPort,
} from '../../../domain/repositories/trainer-assigned-routine.repository.port';

export interface GetClientAssignedRoutinesInput {
  trainerId: string;
  clientId: string;
}

export interface AssignedRoutineItem {
  id: string;
  routineId: string;
  routineName: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  status: string;
  assignedAt: Date;
  notes: string | null;
  exerciseCount: number;
  originLabel: string;
}

export interface GetClientAssignedRoutinesOutput {
  items: AssignedRoutineItem[];
}

@Injectable()
export class GetClientAssignedRoutinesUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT)
    private readonly assignedRoutineRepository: TrainerAssignedRoutineRepositoryPort,
  ) {}

  async execute(
    input: GetClientAssignedRoutinesInput,
  ): Promise<GetClientAssignedRoutinesOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const result = await this.assignedRoutineRepository.findByTrainerAndClient(
      input.trainerId,
      input.clientId,
    );

    return {
      items: result.items.map((r) => ({
        id: r.id,
        routineId: r.routineId,
        routineName: r.routineSnapshot.name,
        description: r.routineSnapshot.description,
        difficulty: r.routineSnapshot.difficulty,
        estimatedDuration: r.routineSnapshot.estimatedDuration,
        status: r.status.value,
        assignedAt: r.assignedAt,
        notes: r.notes,
        exerciseCount: r.routineSnapshot.exercises.length,
        originLabel: 'Asignada por entrenador',
      })),
    };
  }
}

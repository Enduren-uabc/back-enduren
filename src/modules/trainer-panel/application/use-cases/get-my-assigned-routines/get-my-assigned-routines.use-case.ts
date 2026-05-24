import { Injectable, Inject } from '@nestjs/common';
import {
  TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT,
  TrainerAssignedRoutineRepositoryPort,
} from '../../../domain/repositories/trainer-assigned-routine.repository.port';

export interface GetMyAssignedRoutinesInput {
  clientId: string;
}

export interface MyAssignedRoutineItem {
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
  exercises: Array<{
    exerciseId: string;
    name: string;
    sets: number;
    reps: number;
    restSeconds: number;
    order: number;
  }>;
}

export interface GetMyAssignedRoutinesOutput {
  items: MyAssignedRoutineItem[];
}

@Injectable()
export class GetMyAssignedRoutinesUseCase {
  constructor(
    @Inject(TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT)
    private readonly assignedRoutineRepository: TrainerAssignedRoutineRepositoryPort,
  ) {}

  async execute(
    input: GetMyAssignedRoutinesInput,
  ): Promise<GetMyAssignedRoutinesOutput> {
    const active = await this.assignedRoutineRepository.findActiveByClientId(
      input.clientId,
    );
    if (!active) {
      return { items: [] };
    }

    return {
      items: [
        {
          id: active.id,
          routineId: active.routineId,
          routineName: active.routineSnapshot.name,
          description: active.routineSnapshot.description,
          difficulty: active.routineSnapshot.difficulty,
          estimatedDuration: active.routineSnapshot.estimatedDuration,
          status: active.status.value,
          assignedAt: active.assignedAt,
          notes: active.notes,
          originLabel: 'Asignada por entrenador',
          exercises: active.routineSnapshot.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            restSeconds: e.restSeconds,
            order: e.order,
          })),
        },
      ],
    };
  }
}

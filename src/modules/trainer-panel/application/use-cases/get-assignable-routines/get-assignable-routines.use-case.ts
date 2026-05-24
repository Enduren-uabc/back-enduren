import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import {
  TRAINER_LINK_REPOSITORY_PORT,
  TrainerLinkRepositoryPort,
} from '../../../../trainer-link/domain/repositories/trainer-link.repository.port';
import { ROUTINE_REPOSITORY_PORT } from '../../../../training/application/use-cases/create-routine/create-routine.use-case';
import { RoutineRepository } from '../../../../training/domain/repositories/routine.repository';

export interface GetAssignableRoutinesInput {
  trainerId: string;
  clientId: string;
}

export interface AssignableRoutineItem {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  exerciseCount: number;
  isActive: boolean;
}

export interface GetAssignableRoutinesOutput {
  items: AssignableRoutineItem[];
}

@Injectable()
export class GetAssignableRoutinesUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(ROUTINE_REPOSITORY_PORT)
    private readonly routineRepository: RoutineRepository,
  ) {}

  async execute(
    input: GetAssignableRoutinesInput,
  ): Promise<GetAssignableRoutinesOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const routines = await this.routineRepository.findByUserId(input.trainerId);

    return {
      items: routines.map((r) => {
        const totalExercises = r.days.reduce(
          (acc, day) => acc + day.exercises.length,
          0,
        );
        return {
          id: r.id,
          name: r.name,
          description: '',
          difficulty: 'intermediate',
          estimatedDuration: 45,
          exerciseCount: totalExercises,
          isActive: r.isActive,
        };
      }),
    };
  }
}

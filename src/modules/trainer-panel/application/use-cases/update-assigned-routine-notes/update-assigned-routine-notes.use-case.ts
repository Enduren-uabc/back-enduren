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

export interface UpdateAssignedRoutineNotesInput {
  trainerId: string;
  clientId: string;
  assignedId: string;
  notes: string;
}

export interface UpdateAssignedRoutineNotesOutput {
  id: string;
  notes: string | null;
}

@Injectable()
export class UpdateAssignedRoutineNotesUseCase {
  constructor(
    @Inject(TRAINER_LINK_REPOSITORY_PORT)
    private readonly linkRepository: TrainerLinkRepositoryPort,
    @Inject(TRAINER_ASSIGNED_ROUTINE_REPOSITORY_PORT)
    private readonly assignedRoutineRepository: TrainerAssignedRoutineRepositoryPort,
  ) {}

  async execute(
    input: UpdateAssignedRoutineNotesInput,
  ): Promise<UpdateAssignedRoutineNotesOutput> {
    const activeLink =
      await this.linkRepository.findActiveByTrainerIdAndClientId(
        input.trainerId,
        input.clientId,
      );
    if (!activeLink) {
      throw new ForbiddenException('No active link with this client');
    }

    const assigned = await this.assignedRoutineRepository.findByIdAndTrainer(
      input.assignedId,
      input.trainerId,
    );
    if (!assigned) {
      throw new NotFoundException('Assigned routine not found');
    }

    const updated = assigned.updateNotes(input.notes);
    const saved = await this.assignedRoutineRepository.save(updated);

    return {
      id: saved.id,
      notes: saved.notes,
    };
  }
}

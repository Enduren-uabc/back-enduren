import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateAssignedRoutineNotesUseCase } from './update-assigned-routine-notes/update-assigned-routine-notes.use-case';
import { EditAssignedRoutineContentUseCase } from './edit-assigned-routine-content/edit-assigned-routine-content.use-case';
import { ReplaceAssignedRoutineUseCase } from './replace-assigned-routine/replace-assigned-routine.use-case';
import { AssignRoutineToClientUseCase } from './assign-routine-to-client/assign-routine-to-client.use-case';
import { TrainerLinkRepositoryPort } from '../../../trainer-link/domain/repositories/trainer-link.repository.port';
import { TrainerAssignedRoutineRepositoryPort } from '../../domain/repositories/trainer-assigned-routine.repository.port';
import { RoutineRepository } from '../../../training/domain/repositories/routine.repository';
import { NotificationRepository } from '../../../training-reminders/domain/repositories/notification.repository.port';

describe('Assigned routine authorization', () => {
  const input = {
    trainerId: 'trainer',
    clientId: 'client-a',
    assignedId: 'assigned',
    notes: 'note',
  };

  function repositories() {
    const link = {
      findActiveByTrainerIdAndClientId: jest
        .fn()
        .mockResolvedValue({ id: 'link' }),
    };
    const assigned = {
      findByIdAndTrainer: jest.fn().mockResolvedValue({ clientId: 'client-b' }),
      save: jest.fn(),
    };
    const routine = {
      findById: jest
        .fn()
        .mockResolvedValue({ userId: 'trainer', targetAudience: 'self' }),
    };
    const notification = { save: jest.fn() };
    return { link, assigned, routine, notification };
  }

  it('rejects notes for an assigned routine belonging to another client', async () => {
    const { link, assigned } = repositories();
    const useCase = new UpdateAssignedRoutineNotesUseCase(
      link as unknown as TrainerLinkRepositoryPort,
      assigned as unknown as TrainerAssignedRoutineRepositoryPort,
    );
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(assigned.save).not.toHaveBeenCalled();
  });

  it('rejects editing an assigned routine belonging to another client', async () => {
    const { link, assigned, notification } = repositories();
    const useCase = new EditAssignedRoutineContentUseCase(
      link as unknown as TrainerLinkRepositoryPort,
      assigned as unknown as TrainerAssignedRoutineRepositoryPort,
      notification as unknown as NotificationRepository,
    );
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(assigned.save).not.toHaveBeenCalled();
  });

  it('rejects replacing an assigned routine belonging to another client', async () => {
    const { link, assigned, routine, notification } = repositories();
    const useCase = new ReplaceAssignedRoutineUseCase(
      link as unknown as TrainerLinkRepositoryPort,
      routine as unknown as RoutineRepository,
      assigned as unknown as TrainerAssignedRoutineRepositoryPort,
      notification as unknown as NotificationRepository,
    );
    await expect(
      useCase.execute({ ...input, newRoutineId: 'new-routine' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(assigned.save).not.toHaveBeenCalled();
  });

  it('rejects assigning a personal routine to a client', async () => {
    const { link, assigned, routine, notification } = repositories();
    const useCase = new AssignRoutineToClientUseCase(
      link as unknown as TrainerLinkRepositoryPort,
      routine as unknown as RoutineRepository,
      assigned as unknown as TrainerAssignedRoutineRepositoryPort,
      notification as unknown as NotificationRepository,
    );
    await expect(
      useCase.execute({
        trainerId: 'trainer',
        clientId: 'client-a',
        routineId: 'personal',
        notes: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(assigned.save).not.toHaveBeenCalled();
  });
});

import {
  TrainingReminderRepository,
  TRAINING_REMINDER_REPOSITORY_PORT,
} from '../../../domain/repositories/training-reminder.repository.port';
import {
  ReminderDomainError,
  ReminderErrorCode,
} from '../../../domain/errors/reminder-domain.error';
import { ReminderDeletedEvent } from '../../../domain/events/reminder-deleted.event';
import { CurrentActor } from '../../ports/current-actor.port';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface DeleteReminderInput {
  reminderId: string;
}

export class DeleteReminderUseCase {
  constructor(
    private readonly reminderRepository: TrainingReminderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: DeleteReminderInput,
  ): Promise<void> {
    const reminder = await this.reminderRepository.findById(input.reminderId);
    if (!reminder) {
      throw new ReminderDomainError(
        ReminderErrorCode.REMINDER_NOT_FOUND,
        'Reminder not found',
        { reminderId: input.reminderId },
      );
    }

    if (!reminder.isOwnedBy(actor.userId)) {
      throw new ReminderDomainError(
        ReminderErrorCode.REMINDER_NOT_OWNED,
        'This reminder does not belong to the current user',
        { reminderId: input.reminderId },
      );
    }

    const deleted = reminder.delete();
    await this.reminderRepository.save(deleted);

    this.eventEmitter.emit(
      'reminder.deleted',
      new ReminderDeletedEvent(deleted.id, deleted.userId),
    );
  }
}

import { TrainingReminderRepository } from '../../../domain/repositories/training-reminder.repository.port';
import { ReminderDomainError, ReminderErrorCode } from '../../../domain/errors/reminder-domain.error';
import { CurrentActor } from '../../ports/current-actor.port';

export interface EditReminderInput {
  reminderId: string;
  dayOfWeek?: string;
  time?: string;
}

export interface EditReminderOutput {
  id: string;
  routineName: string;
  dayOfWeek: string;
  time: string;
  status: string;
  nextActivationAt: string | null;
}

export class EditReminderUseCase {
  constructor(
    private readonly reminderRepository: TrainingReminderRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: EditReminderInput,
  ): Promise<EditReminderOutput> {
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

    if (reminder.status === 'eliminado') {
      throw new ReminderDomainError(
        ReminderErrorCode.REMINDER_ALREADY_DELETED,
        'Cannot edit a deleted reminder',
        { reminderId: input.reminderId },
      );
    }

    const newDay = (input.dayOfWeek ?? reminder.dayOfWeek) as any;
    const newTime = input.time ?? reminder.time;

    const nextActivationAt = reminder.recalculateNextActivation();

    const edited = reminder.edit({
      dayOfWeek: input.dayOfWeek as any,
      time: input.time,
      nextActivationAt,
    });

    const saved = await this.reminderRepository.save(edited);

    return {
      id: saved.id,
      routineName: saved.routineName,
      dayOfWeek: saved.dayOfWeek,
      time: saved.time,
      status: saved.status,
      nextActivationAt: saved.nextActivationAt?.toISOString() ?? null,
    };
  }
}

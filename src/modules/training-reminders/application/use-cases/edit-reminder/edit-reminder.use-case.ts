import { TrainingReminderRepository } from '../../../domain/repositories/training-reminder.repository.port';
import {
  ReminderDomainError,
  ReminderErrorCode,
} from '../../../domain/errors/reminder-domain.error';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  isValidDayOfWeek,
  isValidTime,
  DayOfWeek,
} from '../../../domain/value-objects/day-of-week.vo';

export const ROUTINE_REPOSITORY_PORT = Symbol('ROUTINE_REPOSITORY_PORT');

export interface RoutineInfo {
  id: string;
  name: string;
  days: Array<{ dayOfWeek: string }>;
  isActive: boolean;
}

export interface RoutineRepository {
  findById(id: string): Promise<RoutineInfo | null>;
}

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
    private readonly routineRepository: RoutineRepository,
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

    const newDay = input.dayOfWeek ?? reminder.dayOfWeek;
    const newTime = input.time ?? reminder.time;

    if (input.dayOfWeek && !isValidDayOfWeek(input.dayOfWeek)) {
      throw new ReminderDomainError(
        ReminderErrorCode.INVALID_DAY,
        `Invalid day: "${input.dayOfWeek}"`,
        { dayOfWeek: input.dayOfWeek },
      );
    }

    if (input.time && !isValidTime(input.time)) {
      throw new ReminderDomainError(
        ReminderErrorCode.INVALID_TIME_FORMAT,
        `Invalid time: "${input.time}". Use HH:mm format`,
        { time: input.time },
      );
    }

    const routine = await this.routineRepository.findById(reminder.routineId);
    if (!routine) {
      throw new ReminderDomainError(
        ReminderErrorCode.ROUTINE_NOT_FOUND,
        'Associated routine not found',
        { routineId: reminder.routineId },
      );
    }

    const dayExists = routine.days.some((d) => d.dayOfWeek === newDay);
    if (!dayExists) {
      throw new ReminderDomainError(
        ReminderErrorCode.DAY_NOT_IN_ROUTINE,
        `Day "${newDay}" is not configured in the associated routine`,
        { dayOfWeek: newDay, routineId: reminder.routineId },
      );
    }

    const nextActivationAt = reminder.recalculateNextActivation();

    const edited = reminder.edit({
      dayOfWeek: newDay as DayOfWeek,
      time: newTime,
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

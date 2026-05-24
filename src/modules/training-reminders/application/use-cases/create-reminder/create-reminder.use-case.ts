import { TrainingReminder } from '../../../domain/entities/training-reminder.entity';
import { ReminderDomainError, ReminderErrorCode } from '../../../domain/errors/reminder-domain.error';
import { ReminderCreatedEvent } from '../../../domain/events/reminder-created.event';
import { TrainingReminderRepository, TRAINING_REMINDER_REPOSITORY_PORT } from '../../../domain/repositories/training-reminder.repository.port';
import { isValidDayOfWeek, isValidTime } from '../../../domain/value-objects/day-of-week.vo';
import { CurrentActor } from '../../ports/current-actor.port';
import { EventEmitter2 } from '@nestjs/event-emitter';

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

export interface CreateReminderInput {
  routineId: string;
  dayOfWeek: string;
  time: string;
  timezone: string;
}

export interface CreateReminderOutput {
  id: string;
  routineName: string;
  dayOfWeek: string;
  time: string;
  status: string;
  nextActivationAt: string | null;
}

export class CreateReminderUseCase {
  constructor(
    private readonly reminderRepository: TrainingReminderRepository,
    private readonly routineRepository: RoutineRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: CreateReminderInput,
  ): Promise<CreateReminderOutput> {
    if (!isValidDayOfWeek(input.dayOfWeek)) {
      throw new ReminderDomainError(
        ReminderErrorCode.INVALID_DAY,
        `Invalid day: "${input.dayOfWeek}"`,
        { dayOfWeek: input.dayOfWeek },
      );
    }

    if (!isValidTime(input.time)) {
      throw new ReminderDomainError(
        ReminderErrorCode.INVALID_TIME_FORMAT,
        `Invalid time: "${input.time}". Use HH:mm format`,
        { time: input.time },
      );
    }

    const routine = await this.routineRepository.findById(input.routineId);
    if (!routine) {
      throw new ReminderDomainError(
        ReminderErrorCode.ROUTINE_NOT_FOUND,
        'Routine not found',
        { routineId: input.routineId },
      );
    }

    if (!routine.isActive) {
      throw new ReminderDomainError(
        ReminderErrorCode.NO_ACTIVE_ROUTINE,
        'Cannot create reminder: routine is not active',
        { routineId: input.routineId },
      );
    }

    const dayExists = routine.days.some((d) => d.dayOfWeek === input.dayOfWeek);
    if (!dayExists) {
      throw new ReminderDomainError(
        ReminderErrorCode.DAY_NOT_IN_ROUTINE,
        `Day "${input.dayOfWeek}" is not configured in the active routine`,
        { dayOfWeek: input.dayOfWeek, routineId: input.routineId },
      );
    }

    const reminder = TrainingReminder.create({
      userId: actor.userId,
      routineId: routine.id,
      routineName: routine.name,
      dayOfWeek: input.dayOfWeek as any,
      time: input.time,
      timezone: input.timezone,
      nextActivationAt: this.calculateNextActivation(input.dayOfWeek, input.time),
    });

    const saved = await this.reminderRepository.save(reminder);

    this.eventEmitter.emit(
      'reminder.created',
      new ReminderCreatedEvent(
        saved.id,
        saved.userId,
        saved.dayOfWeek,
        saved.time,
        saved.nextActivationAt!,
      ),
    );

    return {
      id: saved.id,
      routineName: saved.routineName,
      dayOfWeek: saved.dayOfWeek,
      time: saved.time,
      status: saved.status,
      nextActivationAt: saved.nextActivationAt?.toISOString() ?? null,
    };
  }

  private calculateNextActivation(dayOfWeek: import('../../../domain/value-objects/day-of-week.vo').DayOfWeek, time: string): Date {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);

    if (candidate <= now) {
      candidate.setDate(candidate.getDate() + 1);
    }

    const dayMap: Record<string, number> = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
      friday: 5, saturday: 6, sunday: 0,
    };
    const targetDay = dayMap[dayOfWeek];
    const currentDay = candidate.getDay();
    let diff = targetDay - currentDay;
    if (diff <= 0) diff += 7;
    candidate.setDate(candidate.getDate() + diff);

    return candidate;
  }
}

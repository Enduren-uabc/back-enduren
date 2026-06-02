import {
  ReminderDomainError,
  ReminderErrorCode,
} from '../errors/reminder-domain.error';
import {
  assertValidDayOfWeek,
  assertValidTime,
  type DayOfWeek,
} from '../value-objects/day-of-week.vo';

export type ReminderStatus = 'activo' | 'eliminado' | 'inactivo';

export interface CreateReminderProps {
  userId: string;
  routineId: string;
  routineName: string;
  dayOfWeek: DayOfWeek;
  time: string;
  timezone: string;
  nextActivationAt: Date;
}

export interface TrainingReminderProps {
  id: string;
  userId: string;
  routineId: string;
  routineName: string;
  dayOfWeek: DayOfWeek;
  time: string;
  timezone: string;
  status: ReminderStatus;
  nextActivationAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class TrainingReminder {
  public readonly id: string;
  public readonly userId: string;
  public readonly routineId: string;
  public readonly routineName: string;
  public readonly dayOfWeek: DayOfWeek;
  public readonly time: string;
  public readonly timezone: string;
  public readonly status: ReminderStatus;
  public readonly nextActivationAt: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly deletedAt: Date | null;

  private constructor(props: TrainingReminderProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.routineId = props.routineId;
    this.routineName = props.routineName;
    this.dayOfWeek = props.dayOfWeek;
    this.time = props.time;
    this.timezone = props.timezone;
    this.status = props.status;
    this.nextActivationAt = props.nextActivationAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.deletedAt = props.deletedAt;
  }

  public static create(props: CreateReminderProps): TrainingReminder {
    assertValidDayOfWeek(props.dayOfWeek);
    assertValidTime(props.time);

    return new TrainingReminder({
      id: crypto.randomUUID(),
      userId: props.userId,
      routineId: props.routineId,
      routineName: props.routineName,
      dayOfWeek: props.dayOfWeek,
      time: props.time,
      timezone: props.timezone,
      status: 'activo',
      nextActivationAt: props.nextActivationAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  }

  public static reconstitute(props: TrainingReminderProps): TrainingReminder {
    return new TrainingReminder(props);
  }

  public edit(props: {
    dayOfWeek?: DayOfWeek;
    time?: string;
    nextActivationAt?: Date;
  }): TrainingReminder {
    if (this.status === 'eliminado') {
      throw new ReminderDomainError(
        ReminderErrorCode.REMINDER_ALREADY_DELETED,
        'Cannot edit a deleted reminder',
        { reminderId: this.id },
      );
    }

    const newDay = props.dayOfWeek ?? this.dayOfWeek;
    const newTime = props.time ?? this.time;

    if (props.dayOfWeek) assertValidDayOfWeek(props.dayOfWeek);
    if (props.time) assertValidTime(props.time);

    return new TrainingReminder({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      routineName: this.routineName,
      dayOfWeek: newDay,
      time: newTime,
      timezone: this.timezone,
      status: this.status,
      nextActivationAt: props.nextActivationAt ?? this.nextActivationAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  public delete(): TrainingReminder {
    if (this.status === 'eliminado') {
      throw new ReminderDomainError(
        ReminderErrorCode.REMINDER_ALREADY_DELETED,
        'Reminder is already deleted',
        { reminderId: this.id },
      );
    }

    return new TrainingReminder({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      routineName: this.routineName,
      dayOfWeek: this.dayOfWeek,
      time: this.time,
      timezone: this.timezone,
      status: 'eliminado',
      nextActivationAt: null,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: new Date(),
    });
  }

  public recalculateNextActivation(): Date {
    const now = new Date();
    const [hours, minutes] = this.time.split(':').map(Number);
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);

    if (candidate <= now) {
      candidate.setDate(candidate.getDate() + 1);
    }

    const dayMap: Record<DayOfWeek, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };
    const targetDay = dayMap[this.dayOfWeek];
    const currentDay = candidate.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;
    candidate.setDate(candidate.getDate() + diff);

    return candidate;
  }

  public withNextActivation(date: Date | null): TrainingReminder {
    return new TrainingReminder({
      id: this.id,
      userId: this.userId,
      routineId: this.routineId,
      routineName: this.routineName,
      dayOfWeek: this.dayOfWeek,
      time: this.time,
      timezone: this.timezone,
      status: this.status,
      nextActivationAt: date,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    });
  }

  public isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  public isActive(): boolean {
    return this.status === 'activo';
  }
}

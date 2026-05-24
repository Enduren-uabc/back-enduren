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

  private constructor(
    id: string,
    userId: string,
    routineId: string,
    routineName: string,
    dayOfWeek: DayOfWeek,
    time: string,
    timezone: string,
    status: ReminderStatus,
    nextActivationAt: Date | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ) {
    this.id = id;
    this.userId = userId;
    this.routineId = routineId;
    this.routineName = routineName;
    this.dayOfWeek = dayOfWeek;
    this.time = time;
    this.timezone = timezone;
    this.status = status;
    this.nextActivationAt = nextActivationAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
  }

  public static create(props: CreateReminderProps): TrainingReminder {
    assertValidDayOfWeek(props.dayOfWeek);
    assertValidTime(props.time);

    return new TrainingReminder(
      crypto.randomUUID(),
      props.userId,
      props.routineId,
      props.routineName,
      props.dayOfWeek,
      props.time,
      props.timezone,
      'activo',
      props.nextActivationAt,
      new Date(),
      new Date(),
      null,
    );
  }

  public static reconstitute(props: {
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
  }): TrainingReminder {
    return new TrainingReminder(
      props.id,
      props.userId,
      props.routineId,
      props.routineName,
      props.dayOfWeek,
      props.time,
      props.timezone,
      props.status,
      props.nextActivationAt,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
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

    return new TrainingReminder(
      this.id,
      this.userId,
      this.routineId,
      this.routineName,
      newDay,
      newTime,
      this.timezone,
      this.status,
      props.nextActivationAt ?? this.nextActivationAt,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  public delete(): TrainingReminder {
    if (this.status === 'eliminado') {
      throw new ReminderDomainError(
        ReminderErrorCode.REMINDER_ALREADY_DELETED,
        'Reminder is already deleted',
        { reminderId: this.id },
      );
    }

    return new TrainingReminder(
      this.id,
      this.userId,
      this.routineId,
      this.routineName,
      this.dayOfWeek,
      this.time,
      this.timezone,
      'eliminado',
      null,
      this.createdAt,
      new Date(),
      new Date(),
    );
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
    if (diff <= 0) diff += 7;
    candidate.setDate(candidate.getDate() + diff);

    return candidate;
  }

  public withNextActivation(date: Date | null): TrainingReminder {
    return new TrainingReminder(
      this.id,
      this.userId,
      this.routineId,
      this.routineName,
      this.dayOfWeek,
      this.time,
      this.timezone,
      this.status,
      date,
      this.createdAt,
      new Date(),
      this.deletedAt,
    );
  }

  public isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }

  public isActive(): boolean {
    return this.status === 'activo';
  }
}

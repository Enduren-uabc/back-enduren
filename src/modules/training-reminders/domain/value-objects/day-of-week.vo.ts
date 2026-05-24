import { ReminderDomainError, ReminderErrorCode } from '../errors/reminder-domain.error';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const VALID_DAYS: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function isValidDayOfWeek(value: string): value is DayOfWeek {
  return VALID_DAYS.includes(value as DayOfWeek);
}

export function assertValidDayOfWeek(value: string): DayOfWeek {
  if (!isValidDayOfWeek(value)) {
    throw new ReminderDomainError(
      ReminderErrorCode.INVALID_DAY,
      `Invalid day of week: "${value}". Valid values: ${VALID_DAYS.join(', ')}`,
      { received: value, validValues: VALID_DAYS },
    );
  }
  return value;
}

export function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

export function assertValidTime(value: string): void {
  if (!isValidTime(value)) {
    throw new ReminderDomainError(
      ReminderErrorCode.INVALID_TIME_FORMAT,
      `Invalid time format: "${value}". Expected HH:mm`,
      { received: value },
    );
  }
  const [hours, minutes] = value.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new ReminderDomainError(
      ReminderErrorCode.INVALID_TIME_RANGE,
      `Invalid time range: "${value}". Must be between 00:00 and 23:59`,
      { received: value, hours, minutes },
    );
  }
}

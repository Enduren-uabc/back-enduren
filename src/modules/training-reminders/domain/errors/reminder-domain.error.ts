export enum ReminderErrorCode {
  REMINDER_NOT_FOUND = 'REMINDER_NOT_FOUND',
  REMINDER_NOT_OWNED = 'REMINDER_NOT_OWNED',
  REMINDER_ALREADY_DELETED = 'REMINDER_ALREADY_DELETED',
  NO_ACTIVE_ROUTINE = 'NO_ACTIVE_ROUTINE',
  ROUTINE_NOT_FOUND = 'ROUTINE_NOT_FOUND',
  DAY_NOT_IN_ROUTINE = 'DAY_NOT_IN_ROUTINE',
  INVALID_TIME_FORMAT = 'INVALID_TIME_FORMAT',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
  INVALID_DAY = 'INVALID_DAY',
}

export class ReminderDomainError extends Error {
  public readonly code: ReminderErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ReminderErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ReminderDomainError';
    this.code = code;
    this.details = details;
  }
}

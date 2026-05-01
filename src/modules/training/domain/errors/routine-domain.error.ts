/**
 * Domain errors for the Routine bounded context.
 * Error codes are stable and must not be reused.
 */
export enum RoutineErrorCode {
  ROUTINE_NAME_REQUIRED = 'ROUTINE_NAME_REQUIRED',
  ROUTINE_NAME_EMPTY = 'ROUTINE_NAME_EMPTY',
  ROUTINE_DAYS_REQUIRED = 'ROUTINE_DAYS_REQUIRED',
  ROUTINE_DAYS_MINIMUM = 'ROUTINE_DAYS_MINIMUM',
  ROUTINE_DUPLICATE_NAME = 'ROUTINE_DUPLICATE_NAME',
  ROUTINE_LIMIT_EXCEEDED = 'ROUTINE_LIMIT_EXCEEDED',
  ROUTINE_DAY_INVALID_DAY_OF_WEEK = 'ROUTINE_DAY_INVALID_DAY_OF_WEEK',
  ROUTINE_NOT_FOUND = 'ROUTINE_NOT_FOUND',
  EXERCISE_NAME_REQUIRED = 'EXERCISE_NAME_REQUIRED',
  EXERCISE_DAY_NOT_FOUND = 'EXERCISE_DAY_NOT_FOUND',
  EXERCISE_DAY_LIMIT_EXCEEDED = 'EXERCISE_DAY_LIMIT_EXCEEDED',
  EXERCISE_NOT_FOUND = 'EXERCISE_NOT_FOUND',
}

export class RoutineDomainError extends Error {
  public readonly code: RoutineErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(
    code: RoutineErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'RoutineDomainError';
    this.code = code;
    this.details = details;
  }
}

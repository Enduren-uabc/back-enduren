/**
 * Domain errors for the WorkoutSession bounded context.
 * Error codes are stable and must not be reused.
 */
export enum WorkoutSessionErrorCode {
  SESSION_NO_ACTIVE_ROUTINE = 'SESSION_NO_ACTIVE_ROUTINE',
  SESSION_ALREADY_IN_PROGRESS = 'SESSION_ALREADY_IN_PROGRESS',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_NOT_IN_PROGRESS = 'SESSION_NOT_IN_PROGRESS',
  SESSION_ALREADY_FINISHED = 'SESSION_ALREADY_FINISHED',
}

export class WorkoutSessionDomainError extends Error {
  public readonly code: WorkoutSessionErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(
    code: WorkoutSessionErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'WorkoutSessionDomainError';
    this.code = code;
    this.details = details;
  }
}

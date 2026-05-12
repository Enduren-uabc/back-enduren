/**
 * Domain errors for the TrainingStrategy bounded context.
 */
export enum TrainingStrategyErrorCode {
  STRATEGY_KEY_REQUIRED = 'STRATEGY_KEY_REQUIRED',
  STRATEGY_NAME_REQUIRED = 'STRATEGY_NAME_REQUIRED',
  STRATEGY_NOT_FOUND = 'STRATEGY_NOT_FOUND',
  STRATEGY_RULES_INVALID = 'STRATEGY_RULES_INVALID',
  STRATEGY_KEY_UNKNOWN = 'STRATEGY_KEY_UNKNOWN',
  EXERCISE_SETS_OUT_OF_RANGE = 'EXERCISE_SETS_OUT_OF_RANGE',
  EXERCISE_REPS_OUT_OF_RANGE = 'EXERCISE_REPS_OUT_OF_RANGE',
  EXERCISE_WEIGHT_INVALID = 'EXERCISE_WEIGHT_INVALID',
}

export class TrainingStrategyDomainError extends Error {
  public readonly code: TrainingStrategyErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(
    code: TrainingStrategyErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'TrainingStrategyDomainError';
    this.code = code;
    this.details = details;
  }
}

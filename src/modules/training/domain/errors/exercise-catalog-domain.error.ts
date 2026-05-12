/**
 * Domain errors for the ExerciseCatalog bounded context.
 * Error codes are stable and must not be reused.
 */
export enum ExerciseCatalogErrorCode {
  EXERCISE_NAME_REQUIRED = 'EXERCISE_NAME_REQUIRED',
  EXERCISE_NAME_EMPTY = 'EXERCISE_NAME_EMPTY',
  EXERCISE_CATEGORY_INVALID = 'EXERCISE_CATEGORY_INVALID',
  EXERCISE_EQUIPMENT_INVALID = 'EXERCISE_EQUIPMENT_INVALID',
}

export class ExerciseCatalogDomainError extends Error {
  public readonly code: ExerciseCatalogErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(
    code: ExerciseCatalogErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ExerciseCatalogDomainError';
    this.code = code;
    this.details = details;
  }
}

export class TrainerPanelDomainError extends Error {
  constructor(
    public readonly code: TrainerPanelErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'TrainerPanelDomainError';
  }
}

export const TrainerPanelErrorCode = {
  ROUTINE_NOT_FOUND: 'ROUTINE_NOT_FOUND',
  ROUTINE_NOT_OWNED: 'ROUTINE_NOT_OWNED',
  LINK_NOT_ACTIVE: 'LINK_NOT_ACTIVE',
  CLIENT_ALREADY_HAS_ACTIVE: 'CLIENT_ALREADY_HAS_ACTIVE',
  ASSIGNED_ROUTINE_NOT_FOUND: 'ASSIGNED_ROUTINE_NOT_FOUND',
  ASSIGNED_ROUTINE_NOT_ACTIVE: 'ASSIGNED_ROUTINE_NOT_ACTIVE',
  CANNOT_REPLACE_INACTIVE: 'CANNOT_REPLACE_INACTIVE',
  INVALID_ROUTINE_SNAPSHOT: 'INVALID_ROUTINE_SNAPSHOT',
} as const;

export type TrainerPanelErrorCode =
  (typeof TrainerPanelErrorCode)[keyof typeof TrainerPanelErrorCode];

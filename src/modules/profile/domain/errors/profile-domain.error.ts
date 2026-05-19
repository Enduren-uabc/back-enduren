export enum ProfileErrorCode {
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  PROFILE_ALREADY_EXISTS = 'PROFILE_ALREADY_EXISTS',
  PROFILE_DISPLAY_NAME_REQUIRED = 'PROFILE_DISPLAY_NAME_REQUIRED',
  PROFILE_HANDLE_REQUIRED = 'PROFILE_HANDLE_REQUIRED',
  PROFILE_BIO_TOO_LONG = 'PROFILE_BIO_TOO_LONG',
  PROFILE_AVATAR_URL_INVALID = 'PROFILE_AVATAR_URL_INVALID',
  PROFILE_UPDATE_EMPTY = 'PROFILE_UPDATE_EMPTY',
  PROFILE_SELF_FOLLOW_NOT_ALLOWED = 'PROFILE_SELF_FOLLOW_NOT_ALLOWED',
  PROFILE_SEARCH_QUERY_INVALID = 'PROFILE_SEARCH_QUERY_INVALID',
  PROFILE_PUBLICATIONS_PAGINATION_INVALID = 'PROFILE_PUBLICATIONS_PAGINATION_INVALID',
}

export class ProfileDomainError extends Error {
  public readonly code: ProfileErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(
    code: ProfileErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ProfileDomainError';
    this.code = code;
    this.details = details;
  }
}

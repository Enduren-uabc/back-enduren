export enum StorageErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_DELETE_FAILED = 'FILE_DELETE_FAILED',
  SIGNED_URL_FAILED = 'SIGNED_URL_FAILED',
}

export class StorageDomainError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'StorageDomainError';
  }
}

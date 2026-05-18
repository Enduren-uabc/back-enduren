import { Inject, Injectable } from '@nestjs/common';
import { FileStoragePort, UploadFileOutput } from '../ports/file-storage.port';
import { FILE_STORAGE_PORT, STORAGE_STRATEGY } from '../../storage.constants';
import { StorageStrategy } from './storage-strategy';
import { StorageDomainError, StorageErrorCode } from '../../storage.error';

@Injectable()
export class StorageService {
  constructor(
    @Inject(FILE_STORAGE_PORT)
    private readonly fileStorage: FileStoragePort,
    @Inject(STORAGE_STRATEGY)
    private readonly strategy: StorageStrategy,
  ) {}

  async uploadFile(
    userId: string,
    section: string,
    file: Express.Multer.File,
  ): Promise<UploadFileOutput> {
    this.validate(file);
    const destinationPath = this.strategy.buildPath(
      userId,
      section,
      file.originalname,
    );
    try {
      return await this.fileStorage.upload({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        destinationPath,
      });
    } catch {
      throw new StorageDomainError(
        StorageErrorCode.FILE_UPLOAD_FAILED,
        'File upload failed',
      );
    }
  }

  async getSignedUrl(
    blobPath: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    try {
      return await this.fileStorage.getSignedUrl(blobPath, expiresInSeconds);
    } catch {
      throw new StorageDomainError(
        StorageErrorCode.SIGNED_URL_FAILED,
        'Failed to generate signed URL',
      );
    }
  }

  async delete(blobPath: string): Promise<void> {
    try {
      await this.fileStorage.delete(blobPath);
    } catch {
      throw new StorageDomainError(
        StorageErrorCode.FILE_DELETE_FAILED,
        'File delete failed',
      );
    }
  }

  private validate(file: Express.Multer.File): void {
    if (!this.strategy.allowedMimeTypes.includes(file.mimetype)) {
      throw new StorageDomainError(
        StorageErrorCode.INVALID_FILE_TYPE,
        `File type ${file.mimetype} is not allowed. Allowed: ${this.strategy.allowedMimeTypes.join(', ')}`,
      );
    }
    if (file.size > this.strategy.maxFileSizeBytes) {
      throw new StorageDomainError(
        StorageErrorCode.FILE_TOO_LARGE,
        `File must be ${this.strategy.maxFileSizeBytes / (1024 * 1024)}MB or smaller`,
      );
    }
  }
}

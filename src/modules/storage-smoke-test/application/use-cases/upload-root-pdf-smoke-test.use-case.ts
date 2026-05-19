import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { Readable } from 'stream';
import { UploadFileOutput } from '../../../../shared/storage/domain/ports/file-storage.port';
import { StorageService } from '../../../../shared/storage/domain/services/storage.service';

export interface UploadRootPdfSmokeTestResult extends UploadFileOutput {
  sourceFile: string;
}

@Injectable()
export class UploadRootPdfSmokeTestUseCase {
  private readonly fileName = 'storage-smoke-test.pdf';

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<UploadRootPdfSmokeTestResult> {
    const buffer = await this.readPdfFromRepositoryRoot();
    const uploaded = await this.storageService.uploadFile(
      'storage-smoke-test',
      'smoke-tests',
      this.toMulterFile(buffer),
    );

    return {
      ...uploaded,
      sourceFile: this.fileName,
    };
  }

  private async readPdfFromRepositoryRoot(): Promise<Buffer> {
    const configuredPath = this.configService
      .get<string>('STORAGE_SMOKE_TEST_PDF_PATH')
      ?.trim();
    const candidates = configuredPath
      ? [configuredPath]
      : [
          resolve(process.cwd(), this.fileName),
          resolve(process.cwd(), '..', this.fileName),
        ];

    for (const path of candidates) {
      try {
        return await readFile(path);
      } catch (error) {
        if (!this.isMissingFileError(error)) {
          throw error;
        }
      }
    }

    throw new NotFoundException(
      `No se encontro el archivo ${this.fileName} en la raiz del repositorio`,
    );
  }

  private isMissingFileError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    );
  }

  private toMulterFile(buffer: Buffer): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: this.fileName,
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: buffer.length,
      stream: Readable.from(buffer),
      destination: '',
      filename: this.fileName,
      path: '',
      buffer,
    };
  }
}

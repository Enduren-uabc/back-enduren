import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import {
  FileStoragePort,
  UploadFileInput,
  UploadFileOutput,
} from '../domain/ports/file-storage.port';

@Injectable()
export class AzureBlobStorageService implements FileStoragePort {
  constructor(private readonly configService: ConfigService) {}

  async upload(input: UploadFileInput): Promise<UploadFileOutput> {
    const containerClient = this.getContainerClient(input.containerName);
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient(
      input.destinationPath,
    );
    await blobClient.uploadData(input.buffer, {
      blobHTTPHeaders: {
        blobContentType: input.mimeType,
      },
    });

    return {
      containerName: input.containerName,
      blobPath: input.destinationPath,
      publicUrl: blobClient.url,
      fileName: input.originalName,
      fileSize: input.buffer.length,
    };
  }

  getSignedUrl(
    containerName: string,
    blobPath: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    const credential = this.getSharedKeyCredential();
    const containerClient = this.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobPath);
    const startsOn = new Date(Date.now() - 5 * 60 * 1000);
    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
      },
      credential,
    ).toString();

    return Promise.resolve(`${blobClient.url}?${sas}`);
  }

  async delete(containerName: string, blobPath: string): Promise<void> {
    const blobClient =
      this.getContainerClient(containerName).getBlobClient(blobPath);
    await blobClient.deleteIfExists();
  }

  private getContainerClient(containerName: string) {
    return BlobServiceClient.fromConnectionString(
      this.getConnectionString(),
    ).getContainerClient(containerName);
  }

  private getConnectionString(): string {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is required');
    }
    return connectionString;
  }

  private getSharedKeyCredential(): StorageSharedKeyCredential {
    const parts = new Map(
      this.getConnectionString()
        .split(';')
        .map((part) => {
          const separatorIndex = part.indexOf('=');
          return [
            part.slice(0, separatorIndex),
            part.slice(separatorIndex + 1),
          ] as const;
        }),
    );
    const accountName = parts.get('AccountName');
    const accountKey = parts.get('AccountKey');
    if (!accountName || !accountKey) {
      throw new Error(
        'AZURE_STORAGE_CONNECTION_STRING must include AccountName and AccountKey',
      );
    }
    return new StorageSharedKeyCredential(accountName, accountKey);
  }
}

import { Injectable } from '@nestjs/common';
import { StorageStrategy } from '../../../../shared/storage/domain/services/storage-strategy';

@Injectable()
export class TrainerVerificationStorageStrategy extends StorageStrategy {
  readonly containerName = 'trainer-verification-docs';
  readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ] as const;
  readonly maxFileSizeBytes = 10 * 1024 * 1024;

  buildPath(userId: string, section: string, originalName: string): string {
    const safeName = originalName
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 160);
    return `verifications/${userId}/${section}/${crypto.randomUUID()}-${safeName || 'file'}`;
  }
}

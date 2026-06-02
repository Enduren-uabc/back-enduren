import { Injectable } from '@nestjs/common';
import { StorageStrategy } from '../../../../shared/storage/domain/services/storage-strategy';

@Injectable()
export class PublicationMediaStorageStrategy extends StorageStrategy {
  readonly containerName = 'publication-media';
  readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ] as const;
  readonly maxFileSizeBytes = 20 * 1024 * 1024;

  buildPath(userId: string, section: string, originalName: string): string {
    const safeName = originalName
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 160);
    return `publications/${userId}/${crypto.randomUUID()}-${safeName || 'file'}`;
  }
}

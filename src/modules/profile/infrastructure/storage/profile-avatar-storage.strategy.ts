import { Injectable } from '@nestjs/common';
import { StorageStrategy } from '../../../../shared/storage/domain/services/storage-strategy';

@Injectable()
export class ProfileAvatarStorageStrategy extends StorageStrategy {
  readonly containerName = 'profile-avatars';
  readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ] as const;
  readonly maxFileSizeBytes = 5 * 1024 * 1024;

  buildPath(userId: string, section: string, originalName: string): string {
    const safeName = originalName
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 160);
    return `avatars/${userId}/${crypto.randomUUID()}-${safeName || 'avatar'}`;
  }
}

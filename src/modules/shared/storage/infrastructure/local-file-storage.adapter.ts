import { Injectable } from '@nestjs/common';
import {
  FileStoragePort,
  StoreFileInput,
  StoredFileDescriptor,
} from '../application/ports/file-storage.port';

@Injectable()
export class LocalFileStorageAdapter implements FileStoragePort {
  public store(input: StoreFileInput): Promise<StoredFileDescriptor> {
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `local/${crypto.randomUUID()}-${safeFileName}`;
    return Promise.resolve({ path, url: `local://${path}` });
  }

  public async delete(_path: string): Promise<void> {
    return;
  }
}

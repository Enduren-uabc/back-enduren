import { Module } from '@nestjs/common';
import { FILE_STORAGE_PORT } from './application/ports/file-storage.port';
import { LocalFileStorageAdapter } from './infrastructure/local-file-storage.adapter';

@Module({
  providers: [
    {
      provide: FILE_STORAGE_PORT,
      useClass: LocalFileStorageAdapter,
    },
  ],
  exports: [FILE_STORAGE_PORT],
})
export class StorageModule {}

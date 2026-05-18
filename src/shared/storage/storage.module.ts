import { DynamicModule, Global, Module, Type } from '@nestjs/common';
import { FILE_STORAGE_PORT, STORAGE_STRATEGY } from './storage.constants';
import { StorageStrategy } from './domain/services/storage-strategy';
import { StorageService } from './domain/services/storage.service';
import { AzureBlobStorageService } from './infrastructure/azure-blob-storage.service';

@Global()
@Module({
  providers: [
    {
      provide: FILE_STORAGE_PORT,
      useClass: AzureBlobStorageService,
    },
  ],
  exports: [FILE_STORAGE_PORT],
})
export class StorageModule {
  static forFeature(strategy: Type<StorageStrategy>): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        {
          provide: STORAGE_STRATEGY,
          useClass: strategy,
        },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}

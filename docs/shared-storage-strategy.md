# Sistema de almacenamiento compartido — Strategy Pattern

## Propósito

Desacoplar la lógica de almacenamiento de archivos de los módulos de negocio, permitiendo que cada módulo defina sus propias reglas de validación, organización de directorios y contenedor de almacenamiento sin acoplarse a otros módulos ni a la implementación concreta del proveedor cloud.

## Arquitectura

```
src/shared/storage/
├── storage.module.ts                 # @Global() + DynamicModule.forFeature()
├── storage.constants.ts              # DI tokens: FILE_STORAGE_PORT, STORAGE_STRATEGY
├── storage.error.ts                  # StorageDomainError + StorageErrorCode
├── domain/
│   ├── ports/
│   │   └── file-storage.port.ts      # FileStoragePort (interfaz base)
│   └── services/
│       ├── storage-strategy.ts       # StorageStrategy (abstract class)
│       └── storage.service.ts        # StorageService (facade)
└── infrastructure/
    └── azure-blob-storage.service.ts # AzureBlobStorageService (adapter concreto)
```

### Capas

| Capa | Rol |
|------|-----|
| `FileStoragePort` | Contrato base: `upload()`, `getSignedUrl()`, `delete()` |
| `StorageStrategy` | Abstracta. Cada módulo extiende esta clase con sus reglas |
| `StorageService` | Facade que recibe una estrategia concreta y el puerto de almacenamiento |
| `AzureBlobStorageService` | Implementación concreta de `FileStoragePort` usando Azure Blob Storage |

## Cómo funciona

### 1. `StorageStrategy` — clase abstracta base

Cada módulo de negocio extiende esta clase para definir:

- `containerName` — nombre del contenedor en Azure Blob Storage
- `allowedMimeTypes` — tipos MIME permitidos
- `maxFileSizeBytes` — tamaño máximo por archivo
- `buildPath(userId, section, originalName)` — lógica para construir la ruta del blob

```ts
export abstract class StorageStrategy {
  abstract readonly containerName: string;
  abstract readonly allowedMimeTypes: readonly string[];
  abstract readonly maxFileSizeBytes: number;
  abstract buildPath(userId: string, section: string, originalName: string): string;
}
```

### 2. `StorageService` — facade unificado

Inyecta `FileStoragePort` (el adapter cloud) y `StorageStrategy` (la configuración del módulo).

Ofrece tres métodos públicos:

- `uploadFile(userId, section, file)` — valida el archivo contra la estrategia, construye la ruta y lo sube
- `getSignedUrl(containerName, blobPath)` — genera URL temporaria de acceso
- `delete(containerName, blobPath)` — elimina un blob

### 3. `StorageModule` — registro vía Dynamic Module

El módulo base es `@Global()`, exporta `FileStoragePort` (Azure) para toda la app.

Cada módulo de negocio se registra con `StorageModule.forFeature(StrategyClass)`, lo que crea un `StorageService` scoped con su propia estrategia.

```ts
@Module({})
export class StorageModule {
  static forFeature(strategy: Type<StorageStrategy>): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        { provide: STORAGE_STRATEGY, useClass: strategy },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}
```

## Cómo consumirlo desde un módulo nuevo

### Paso 1: Crear la estrategia

```ts
// modules/mi-modulo/infrastructure/storage/mi-modulo-storage.strategy.ts
import { Injectable } from '@nestjs/common';
import { StorageStrategy } from '../../../../shared/storage/domain/services/storage-strategy';

@Injectable()
export class MiModuloStorageStrategy extends StorageStrategy {
  readonly containerName = 'mi-contenedor';
  readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'] as const;
  readonly maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

  buildPath(userId: string, section: string, originalName: string): string {
    const safeName = originalName
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 160);
    return `mi-modulo/${userId}/${section}/${crypto.randomUUID()}-${safeName || 'file'}`;
  }
}
```

### Paso 2: Registrar en el módulo

```ts
// modules/mi-modulo/mi-modulo.module.ts
import { Module } from '@nestjs/common';
import { StorageModule } from '../../shared/storage/storage.module';
import { MiModuloStorageStrategy } from './infrastructure/storage/mi-modulo-storage.strategy';

@Module({
  imports: [
    StorageModule.forFeature(MiModuloStorageStrategy),
    // ...
  ],
  providers: [
    // tus casos de uso, repositorios, etc.
  ],
})
export class MiModuloModule {}
```

### Paso 3: Inyectar `StorageService` en los casos de uso

```ts
// modules/mi-modulo/application/use-cases/subir-archivo/subir-archivo.use-case.ts
import { Injectable } from '@nestjs/common';
import { StorageService } from '../../../../shared/storage/domain/services/storage.service';

@Injectable()
export class SubirArchivoUseCase {
  constructor(
    private readonly storageService: StorageService,
  ) {}

  async execute(userId: string, file: Express.Multer.File) {
    const result = await this.storageService.uploadFile(userId, 'documentos', file);
    // result.containerName, result.blobPath, result.publicUrl, result.fileName, result.fileSize
  }
}
```

## Ejemplo: `TrainerVerificationStorageStrategy`

```ts
@Injectable()
export class TrainerVerificationStorageStrategy extends StorageStrategy {
  readonly containerName = 'trainer-verification-docs';
  readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
  readonly maxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

  buildPath(userId: string, section: string, originalName: string): string {
    return `verifications/${userId}/${section}/${crypto.randomUUID()}-${/* safeName */originalName}`;
  }
}
```

Registrado en `TrainerVerificationModule`:

```ts
@Module({
  imports: [StorageModule.forFeature(TrainerVerificationStorageStrategy)],
  // ...
})
```

Los casos de uso (`submit`, `update`, `get-detail`) inyectan `StorageService` en lugar de `FileStoragePort`.

## Contrato `FileStoragePort`

```ts
export interface FileStoragePort {
  upload(input: UploadFileInput): Promise<UploadFileOutput>;
  getSignedUrl(blobPath: string, expiresInSeconds?: number): Promise<string>;
  delete(blobPath: string): Promise<void>;
}
```

`AzureBlobStorageService` es la única implementación actual. Si se migra a S3, Cloudinary o MinIO, solo se crea un nuevo adapter que implemente `FileStoragePort` y se cambia el binding en `StorageModule`.

## Consideraciones

- Los casos de uso deben hacer **rollback** de archivos subidos si falla la operación de base de datos (ver patrón en `submit-trainer-verification.use-case.ts`).
- La validación de archivos (MIME type y tamaño) la realiza `StorageService` automáticamente según la estrategia. No duplicar validación en capas superiores.
- El controlador HTTP DEBE configurar Multer con `limits.fileSize` acorde a la estrategia para rechazar archivos grandes temprano.
- `StorageModule` es `@Global()` para que `FileStoragePort` esté disponible en `forFeature()` sin necesidad de importar el módulo base manualmente en cada feature.

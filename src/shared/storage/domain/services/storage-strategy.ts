export abstract class StorageStrategy {
  abstract readonly containerName: string;
  abstract readonly allowedMimeTypes: readonly string[];
  abstract readonly maxFileSizeBytes: number;

  abstract buildPath(
    userId: string,
    section: string,
    originalName: string,
  ): string;
}

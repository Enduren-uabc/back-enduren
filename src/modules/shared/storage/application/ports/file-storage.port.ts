export interface StoredFileDescriptor {
  url: string;
  path: string;
}

export interface StoreFileInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface FileStoragePort {
  store(input: StoreFileInput): Promise<StoredFileDescriptor>;
  delete(path: string): Promise<void>;
}

export const FILE_STORAGE_PORT = Symbol('FILE_STORAGE_PORT');

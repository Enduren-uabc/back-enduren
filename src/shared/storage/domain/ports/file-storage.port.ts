export interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  destinationPath: string;
}

export interface UploadFileOutput {
  blobPath: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
}

export interface FileStoragePort {
  upload(input: UploadFileInput): Promise<UploadFileOutput>;
  getSignedUrl(blobPath: string, expiresInSeconds?: number): Promise<string>;
  delete(blobPath: string): Promise<void>;
}

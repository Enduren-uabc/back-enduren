export interface UploadFileInput {
  containerName: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  destinationPath: string;
}

export interface UploadFileOutput {
  containerName: string;
  blobPath: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
}

export interface FileStoragePort {
  upload(input: UploadFileInput): Promise<UploadFileOutput>;
  getSignedUrl(
    containerName: string,
    blobPath: string,
    expiresInSeconds?: number,
  ): Promise<string>;
  delete(containerName: string, blobPath: string): Promise<void>;
}

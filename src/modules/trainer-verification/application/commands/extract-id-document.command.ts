export class ExtractIdDocumentCommand {
  constructor(
    public readonly verificationId: string,
    public readonly userId: string,
    public readonly buffer: Buffer,
    public readonly mimeType: string,
    public readonly originalFileName: string,
  ) {}
}

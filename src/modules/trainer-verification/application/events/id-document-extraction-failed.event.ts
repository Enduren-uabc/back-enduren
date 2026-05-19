export class IdDocumentExtractionFailedEvent {
  constructor(
    public readonly verificationId: string,
    public readonly errorCode: string,
    public readonly errorMessage: string,
    public readonly userId: string,
  ) {}
}

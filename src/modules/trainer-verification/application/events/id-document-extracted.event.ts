import { ExtractedIdData } from '../../domain/value-objects/extracted-id-data.vo';

export class IdDocumentExtractedEvent {
  constructor(
    public readonly verificationId: string,
    public readonly extractedData: ExtractedIdData,
    public readonly userId: string,
  ) {}
}

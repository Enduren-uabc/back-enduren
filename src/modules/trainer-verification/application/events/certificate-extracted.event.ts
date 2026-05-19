import { ExtractedCertificateData } from '../../domain/value-objects/extracted-certificate-data.vo';

export class CertificateExtractedEvent {
  constructor(
    public readonly verificationId: string,
    public readonly extractedData: ExtractedCertificateData,
    public readonly userId: string,
  ) {}
}

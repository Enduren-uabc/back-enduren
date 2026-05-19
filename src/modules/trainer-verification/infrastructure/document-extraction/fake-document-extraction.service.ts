import { Injectable } from '@nestjs/common';
import {
  DocumentExtractionPort,
  ExtractionResult,
} from '../../application/ports/document-extraction.port';
import { ExtractedCertificateData } from '../../domain/value-objects/extracted-certificate-data.vo';
import { ExtractedIdData } from '../../domain/value-objects/extracted-id-data.vo';

@Injectable()
export class FakeDocumentExtractionService implements DocumentExtractionPort {
  async extractCertificate(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<ExtractionResult<ExtractedCertificateData>> {
    void buffer;
    void mimeType;
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));

    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');

    const data = ExtractedCertificateData.create({
      fullName: 'Juan Perez Lopez',
      certificateName: nameWithoutExt,
      issuingOrganization: 'NASM',
      issueDate: new Date('2024-01-15'),
      expirationDate: new Date('2027-01-15'),
      folioNumber:
        'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      ocrConfidence: 0.89 + Math.random() * 0.1,
    });

    return { success: true, data };
  }

  async extractIdDocument(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<ExtractionResult<ExtractedIdData>> {
    void buffer;
    void mimeType;
    void originalName;
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2000));

    const data = ExtractedIdData.create({
      fullName: 'Juan Perez Lopez',
      documentType: 'INE',
      issuingCountry: 'Mexico',
      birthDate: new Date('1990-05-20'),
      expirationDate: new Date('2030-05-20'),
      documentIdentifier: 'INE****5678',
      ocrConfidence: 0.92 + Math.random() * 0.07,
    });

    return { success: true, data };
  }
}

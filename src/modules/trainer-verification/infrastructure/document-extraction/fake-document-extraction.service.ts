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
    _buffer: Buffer,
    _mimeType: string,
    originalName: string,
  ): Promise<ExtractionResult<ExtractedCertificateData>> {
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000)); // sonarqube:prng-safe-context

    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');

    const data = ExtractedCertificateData.create({
      fullName: 'Juan Perez Lopez',
      certificateName: nameWithoutExt,
      issuingOrganization: 'CONOCER',
      issueDate: new Date('2024-01-15'),
      expirationDate: new Date('2027-01-15'),
      folioNumber:
        'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase(), // sonarqube:prng-safe-context
      ocrConfidence: 0.89 + Math.random() * 0.1, // sonarqube:prng-safe-context
      curp: 'JUPE900101HDFRRN01',
      documentType: 'certificate',
      certifyingInstitution: 'ICEM',
      competencyStandardCode: 'EC0474',
      competencyStandardName: 'Acondicionamiento físico de jóvenes y adultos',
    });

    return { success: true, data };
  }

  async extractIdDocument(
    _buffer: Buffer,
    _mimeType: string,
    _originalName: string,
  ): Promise<ExtractionResult<ExtractedIdData>> {
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 2000)); // sonarqube:prng-safe-context

    const data = ExtractedIdData.create({
      fullName: 'Juan Perez Lopez',
      documentType: 'INE',
      issuingCountry: 'Mexico',
      birthDate: new Date('1990-05-20'),
      expirationDate: new Date('2030-05-20'),
      documentIdentifier: 'INE****5678',
      ocrConfidence: 0.92 + Math.random() * 0.07, // sonarqube:prng-safe-context
      curp: 'JUPE900101HDFRRN01',
    });

    return { success: true, data };
  }
}

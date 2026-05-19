import { ExtractedCertificateData } from '../../domain/value-objects/extracted-certificate-data.vo';
import { ExtractedIdData } from '../../domain/value-objects/extracted-id-data.vo';

export const DOCUMENT_EXTRACTION_PORT = Symbol('DOCUMENT_EXTRACTION_PORT');

export type ExtractionErrorCode =
  | 'technical_failure'
  | 'unreadable_document'
  | 'insufficient_data';

export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
}

export interface ExtractionResult<T> {
  success: boolean;
  data?: T;
  error?: ExtractionError;
}

export interface DocumentExtractionPort {
  extractCertificate(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<ExtractionResult<ExtractedCertificateData>>;

  extractIdDocument(
    buffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<ExtractionResult<ExtractedIdData>>;
}

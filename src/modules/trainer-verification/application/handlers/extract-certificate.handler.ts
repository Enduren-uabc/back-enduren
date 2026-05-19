import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_EXTRACTION_PORT,
  DocumentExtractionPort,
} from '../ports/document-extraction.port';
import { ExtractCertificateCommand } from '../commands/extract-certificate.command';
import { CertificateExtractedEvent } from '../events/certificate-extracted.event';
import { CertificateExtractionFailedEvent } from '../events/certificate-extraction-failed.event';
import { InMemoryEventBus } from '../../infrastructure/cqrs/in-memory-event-bus';

@Injectable()
export class ExtractCertificateHandler {
  constructor(
    @Inject(DOCUMENT_EXTRACTION_PORT)
    private readonly extractionPort: DocumentExtractionPort,
    private readonly eventBus: InMemoryEventBus,
  ) {}

  async handle(command: ExtractCertificateCommand): Promise<void> {
    const result = await this.extractionPort.extractCertificate(
      command.buffer,
      command.mimeType,
      command.originalFileName,
    );

    if (result.success && result.data) {
      await this.eventBus.emit(
        new CertificateExtractedEvent(
          command.verificationId,
          result.data,
          command.userId,
        ),
      );
    } else {
      await this.eventBus.emit(
        new CertificateExtractionFailedEvent(
          command.verificationId,
          result.error?.code ?? 'technical_failure',
          result.error?.message ?? 'Unknown extraction error',
          command.userId,
        ),
      );
    }
  }
}

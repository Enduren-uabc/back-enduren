import { Inject, Injectable } from '@nestjs/common';
import {
  DOCUMENT_EXTRACTION_PORT,
  DocumentExtractionPort,
} from '../ports/document-extraction.port';
import { ExtractIdDocumentCommand } from '../commands/extract-id-document.command';
import { IdDocumentExtractedEvent } from '../events/id-document-extracted.event';
import { IdDocumentExtractionFailedEvent } from '../events/id-document-extraction-failed.event';
import { InMemoryEventBus } from '../../infrastructure/cqrs/in-memory-event-bus';

@Injectable()
export class ExtractIdDocumentHandler {
  constructor(
    @Inject(DOCUMENT_EXTRACTION_PORT)
    private readonly extractionPort: DocumentExtractionPort,
    private readonly eventBus: InMemoryEventBus,
  ) {}

  async handle(command: ExtractIdDocumentCommand): Promise<void> {
    const result = await this.extractionPort.extractIdDocument(
      command.buffer,
      command.mimeType,
      command.originalFileName,
    );

    if (result.success && result.data) {
      await this.eventBus.emit(
        new IdDocumentExtractedEvent(
          command.verificationId,
          result.data,
          command.userId,
        ),
      );
    } else {
      await this.eventBus.emit(
        new IdDocumentExtractionFailedEvent(
          command.verificationId,
          result.error?.code ?? 'technical_failure',
          result.error?.message ?? 'Unknown extraction error',
          command.userId,
        ),
      );
    }
  }
}

import { ExtractIdDocumentHandler } from '../extract-id-document.handler';
import { ExtractIdDocumentCommand } from '../../commands/extract-id-document.command';
import { IdDocumentExtractedEvent } from '../../events/id-document-extracted.event';
import { IdDocumentExtractionFailedEvent } from '../../events/id-document-extraction-failed.event';
import { ExtractedIdData } from '../../../domain/value-objects/extracted-id-data.vo';
import { InMemoryEventBus } from '../../../infrastructure/cqrs/in-memory-event-bus';

describe('ExtractIdDocumentHandler', () => {
  const makeSut = (extractionPort: any) => {
    const eventBus = new InMemoryEventBus();
    const handler = new ExtractIdDocumentHandler(extractionPort, eventBus);
    return { handler, eventBus };
  };

  it('emits IdDocumentExtractedEvent on success', async () => {
    const extractedData = ExtractedIdData.create({
      fullName: 'Juan Perez',
      documentType: 'INE',
      ocrConfidence: 0.95,
    });

    const extractionPort = {
      extractIdDocument: jest.fn().mockResolvedValue({
        success: true,
        data: extractedData,
      }),
    };

    const { handler, eventBus } = makeSut(extractionPort);
    const eventSpy = jest.fn();
    eventBus.on('IdDocumentExtractedEvent', eventSpy);

    const command = new ExtractIdDocumentCommand(
      'verification-1',
      'user-1',
      Buffer.from('test'),
      'application/pdf',
      'id.pdf',
    );

    await handler.handle(command);

    expect(extractionPort.extractIdDocument).toHaveBeenCalledWith(
      command.buffer,
      command.mimeType,
      command.originalFileName,
    );
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0]).toBeInstanceOf(IdDocumentExtractedEvent);
    expect(eventSpy.mock.calls[0][0].verificationId).toBe('verification-1');
    expect(eventSpy.mock.calls[0][0].extractedData).toBe(extractedData);
  });

  it('emits IdDocumentExtractionFailedEvent on failure', async () => {
    const extractionPort = {
      extractIdDocument: jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'unreadable_document', message: 'Could not read ID' },
      }),
    };

    const { handler, eventBus } = makeSut(extractionPort);
    const eventSpy = jest.fn();
    eventBus.on('IdDocumentExtractionFailedEvent', eventSpy);

    await handler.handle(
      new ExtractIdDocumentCommand(
        'v1',
        'u1',
        Buffer.from('bad'),
        'png',
        'bad.png',
      ),
    );

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0]).toBeInstanceOf(
      IdDocumentExtractionFailedEvent,
    );
    expect(eventSpy.mock.calls[0][0].errorCode).toBe('unreadable_document');
  });
});

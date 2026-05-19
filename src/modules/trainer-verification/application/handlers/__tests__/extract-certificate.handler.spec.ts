import { ExtractCertificateHandler } from '../extract-certificate.handler';
import { ExtractCertificateCommand } from '../../commands/extract-certificate.command';
import { CertificateExtractedEvent } from '../../events/certificate-extracted.event';
import { CertificateExtractionFailedEvent } from '../../events/certificate-extraction-failed.event';
import { ExtractedCertificateData } from '../../../domain/value-objects/extracted-certificate-data.vo';
import { InMemoryEventBus } from '../../../infrastructure/cqrs/in-memory-event-bus';

describe('ExtractCertificateHandler', () => {
  const makeSut = (extractionPort: any) => {
    const eventBus = new InMemoryEventBus();
    const handler = new ExtractCertificateHandler(extractionPort, eventBus);
    return { handler, eventBus };
  };

  it('emits CertificateExtractedEvent on success', async () => {
    const extractedData = ExtractedCertificateData.create({
      fullName: 'Juan Perez',
      certificateName: 'CPT',
      issuingOrganization: 'NASM',
      ocrConfidence: 0.95,
    });

    const extractionPort = {
      extractCertificate: jest.fn().mockResolvedValue({
        success: true,
        data: extractedData,
      }),
    };

    const { handler, eventBus } = makeSut(extractionPort);
    const eventSpy = jest.fn();
    eventBus.on('CertificateExtractedEvent', eventSpy);

    const command = new ExtractCertificateCommand(
      'verification-1',
      'user-1',
      Buffer.from('test'),
      'application/pdf',
      'cert.pdf',
    );

    await handler.handle(command);

    expect(extractionPort.extractCertificate).toHaveBeenCalledWith(
      command.buffer,
      command.mimeType,
      command.originalFileName,
    );
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0]).toBeInstanceOf(CertificateExtractedEvent);
    expect(eventSpy.mock.calls[0][0].verificationId).toBe('verification-1');
    expect(eventSpy.mock.calls[0][0].extractedData).toBe(extractedData);
  });

  it('emits CertificateExtractionFailedEvent on failure', async () => {
    const extractionPort = {
      extractCertificate: jest.fn().mockResolvedValue({
        success: false,
        error: {
          code: 'unreadable_document',
          message: 'Could not read document',
        },
      }),
    };

    const { handler, eventBus } = makeSut(extractionPort);
    const eventSpy = jest.fn();
    eventBus.on('CertificateExtractionFailedEvent', eventSpy);

    const command = new ExtractCertificateCommand(
      'verification-1',
      'user-1',
      Buffer.from('bad'),
      'image/png',
      'bad.png',
    );

    await handler.handle(command);

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0]).toBeInstanceOf(
      CertificateExtractionFailedEvent,
    );
    expect(eventSpy.mock.calls[0][0].errorCode).toBe('unreadable_document');
    expect(eventSpy.mock.calls[0][0].errorMessage).toBe(
      'Could not read document',
    );
  });

  it('uses fallback message when error has no message', async () => {
    const extractionPort = {
      extractCertificate: jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'technical_failure' },
      }),
    };

    const { handler, eventBus } = makeSut(extractionPort);
    const eventSpy = jest.fn();
    eventBus.on('CertificateExtractionFailedEvent', eventSpy);

    await handler.handle(
      new ExtractCertificateCommand(
        'v1',
        'u1',
        Buffer.from('x'),
        'pdf',
        'x.pdf',
      ),
    );

    expect(eventSpy.mock.calls[0][0].errorMessage).toBe(
      'Unknown extraction error',
    );
  });
});

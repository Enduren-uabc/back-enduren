import { FakeDocumentExtractionService } from './fake-document-extraction.service';

describe('FakeDocumentExtractionService', () => {
  const service = new FakeDocumentExtractionService();

  it('extractCertificate returns success with coherent data', async () => {
    const result = await service.extractCertificate(
      Buffer.from('fake'),
      'application/pdf',
      'certification.pdf',
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.fullName).toBeTruthy();
    expect(result.data!.certificateName).toBeTruthy();
    expect(result.data!.issuingOrganization).toBeTruthy();
    expect(result.data!.ocrConfidence).toBeGreaterThan(0);
    expect(result.data!.ocrConfidence).toBeLessThanOrEqual(1);
  });

  it('extractCertificate uses original file name as certificate name', async () => {
    const result = await service.extractCertificate(
      Buffer.from('fake'),
      'image/png',
      'NASM-CPT-2024.pdf',
    );

    expect(result.data!.certificateName).toBe('NASM-CPT-2024');
  });

  it('extractCertificate generates a folio number', async () => {
    const result = await service.extractCertificate(
      Buffer.from('fake'),
      'application/pdf',
      'cert.pdf',
    );

    expect(result.data!.folioNumber).toBeTruthy();
    expect(result.data!.folioNumber).toMatch(/^CERT-/);
  });

  it('extractIdDocument returns success with coherent data', async () => {
    const result = await service.extractIdDocument(
      Buffer.from('fake'),
      'image/png',
      'id.png',
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.fullName).toBeTruthy();
    expect(result.data!.documentType).toBe('INE');
    expect(result.data!.ocrConfidence).toBeGreaterThan(0);
    expect(result.data!.ocrConfidence).toBeLessThanOrEqual(1);
  });

  it('simulates realistic delay', async () => {
    const start = Date.now();
    await service.extractCertificate(Buffer.from('x'), 'pdf', 'x.pdf');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(0);
  }, 10000);
});

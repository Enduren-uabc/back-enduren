import { ExtractedCertificateData } from './extracted-certificate-data.vo';

describe('ExtractedCertificateData', () => {
  it('creates with all fields', () => {
    const data = ExtractedCertificateData.create({
      fullName: 'Juan Perez',
      certificateName: 'Certified Personal Trainer',
      issuingOrganization: 'NASM',
      issueDate: new Date('2024-01-15'),
      expirationDate: new Date('2027-01-15'),
      folioNumber: 'CERT-123',
      qrUrl: 'https://verify.example.com/123',
      ocrConfidence: 0.95,
    });

    expect(data.fullName).toBe('Juan Perez');
    expect(data.certificateName).toBe('Certified Personal Trainer');
    expect(data.issuingOrganization).toBe('NASM');
    expect(data.issueDate).toEqual(new Date('2024-01-15'));
    expect(data.expirationDate).toEqual(new Date('2027-01-15'));
    expect(data.folioNumber).toBe('CERT-123');
    expect(data.qrUrl).toBe('https://verify.example.com/123');
    expect(data.ocrConfidence).toBe(0.95);
  });

  it('creates with only required fields', () => {
    const data = ExtractedCertificateData.create({
      fullName: 'Juan Perez',
      certificateName: 'CPT',
      issuingOrganization: 'NASM',
      ocrConfidence: 0.8,
    });

    expect(data.fullName).toBe('Juan Perez');
    expect(data.certificateName).toBe('CPT');
    expect(data.issuingOrganization).toBe('NASM');
    expect(data.ocrConfidence).toBe(0.8);
  });

  it('reconstitute returns same data', () => {
    const original = ExtractedCertificateData.create({
      fullName: 'Ana Lopez',
      certificateName: 'Nutrition Coach',
      issuingOrganization: 'ACE',
      ocrConfidence: 0.9,
    });

    const reconstituted = ExtractedCertificateData.reconstitute({
      fullName: 'Ana Lopez',
      certificateName: 'Nutrition Coach',
      issuingOrganization: 'ACE',
      ocrConfidence: 0.9,
    });

    expect(reconstituted.fullName).toBe(original.fullName);
    expect(reconstituted.certificateName).toBe(original.certificateName);
    expect(reconstituted.issuingOrganization).toBe(
      original.issuingOrganization,
    );
    expect(reconstituted.ocrConfidence).toBe(original.ocrConfidence);
  });
});

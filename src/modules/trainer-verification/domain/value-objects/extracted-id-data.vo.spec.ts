import { ExtractedIdData } from './extracted-id-data.vo';

describe('ExtractedIdData', () => {
  it('creates with all fields', () => {
    const data = ExtractedIdData.create({
      fullName: 'Juan Perez Lopez',
      documentType: 'INE',
      issuingCountry: 'Mexico',
      birthDate: new Date('1990-05-20'),
      expirationDate: new Date('2030-05-20'),
      documentIdentifier: 'INE****5678',
      ocrConfidence: 0.95,
    });

    expect(data.fullName).toBe('Juan Perez Lopez');
    expect(data.documentType).toBe('INE');
    expect(data.issuingCountry).toBe('Mexico');
    expect(data.birthDate).toEqual(new Date('1990-05-20'));
    expect(data.expirationDate).toEqual(new Date('2030-05-20'));
    expect(data.documentIdentifier).toBe('INE****5678');
    expect(data.ocrConfidence).toBe(0.95);
  });

  it('creates with only required fields', () => {
    const data = ExtractedIdData.create({
      fullName: 'Maria Garcia',
      documentType: 'passport',
      ocrConfidence: 0.88,
    });

    expect(data.fullName).toBe('Maria Garcia');
    expect(data.documentType).toBe('passport');
    expect(data.ocrConfidence).toBe(0.88);
  });

  it('reconstitute returns same data', () => {
    const original = ExtractedIdData.create({
      fullName: 'Carlos Ruiz',
      documentType: 'driver_license',
      ocrConfidence: 0.92,
    });

    const reconstituted = ExtractedIdData.reconstitute({
      fullName: 'Carlos Ruiz',
      documentType: 'driver_license',
      ocrConfidence: 0.92,
    });

    expect(reconstituted.fullName).toBe(original.fullName);
    expect(reconstituted.documentType).toBe(original.documentType);
    expect(reconstituted.ocrConfidence).toBe(original.ocrConfidence);
  });
});

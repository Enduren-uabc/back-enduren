import { OnCertificateExtractedHandler } from '../on-certificate-extracted.handler';
import { CertificateExtractedEvent } from '../../events/certificate-extracted.event';
import { ExtractedCertificateData } from '../../../domain/value-objects/extracted-certificate-data.vo';
import { TrainerVerificationStateMachineService } from '../../services/trainer-verification-state-machine.service';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import { AdvancedVerificationStatus } from '../../../domain/value-objects/advanced-verification-status.vo';

describe('OnCertificateExtractedHandler', () => {
  const makeVerification = () => {
    return TrainerVerification.reconstitute({
      id: crypto.randomUUID(),
      userId: crypto.randomUUID(),
      verificationStatus: 'pending',
      specialtyKeys: ['strength'],
      yearsOfExperience: 0,
      shortBio: 'Biografia valida para pruebas',
      idDocumentNumber: 'ID-123',
      idDocuments: [
        {
          id: 'doc-1',
          documentType: 'passport' as const,
          containerName: 'test',
          fileUrl: 'url',
          fileName: 'doc.pdf',
          fileSize: 100,
          uploadedAt: new Date(),
        },
      ],
      certificates: [
        {
          id: 'cert-1',
          name: 'CPT',
          issuingOrganization: 'NASM',
          containerName: 'test',
          documentUrl: 'url',
          fileName: 'cert.pdf',
          fileSize: 200,
          uploadedAt: new Date(),
        },
      ],
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      advancedStatus: 'certificate_extraction_pending',
    });
  };

  it('transitions to certificate_extracted and persists data', async () => {
    const verification = makeVerification();
    const repository = {
      findById: jest.fn().mockResolvedValue(verification),
      findByUserId: jest.fn(),
      listPending: jest.fn(),
      findDetailById: jest.fn(),
      save: jest.fn().mockResolvedValue(verification),
    };
    const auditRepo = {
      recordStatusChange: jest.fn().mockResolvedValue(undefined),
      recordAuditEvent: jest.fn().mockResolvedValue(undefined),
      getStatusHistory: jest.fn(),
      getAuditEvents: jest.fn(),
    };
    const stateMachine = new TrainerVerificationStateMachineService();

    const handler = new OnCertificateExtractedHandler(
      repository,
      auditRepo,
      stateMachine,
    );

    const extractedData = ExtractedCertificateData.create({
      fullName: 'Juan Perez',
      certificateName: 'CPT',
      issuingOrganization: 'NASM',
      ocrConfidence: 0.95,
    });

    const event = new CertificateExtractedEvent(
      verification.id,
      extractedData,
      'user-1',
    );

    await handler.handle(event);

    expect(repository.findById).toHaveBeenCalledWith(verification.id);
    expect(verification.extractedCertificateData).toBe(extractedData);
    expect(repository.save).toHaveBeenCalledWith(verification);
    expect(auditRepo.recordStatusChange).toHaveBeenCalledTimes(1);
    expect(auditRepo.recordAuditEvent).toHaveBeenCalledTimes(1);
  });

  it('does nothing when verification is not found', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(null),
      findByUserId: jest.fn(),
      listPending: jest.fn(),
      findDetailById: jest.fn(),
      save: jest.fn(),
    };
    const auditRepo = {
      recordStatusChange: jest.fn(),
      recordAuditEvent: jest.fn(),
      getStatusHistory: jest.fn(),
      getAuditEvents: jest.fn(),
    };
    const stateMachine = new TrainerVerificationStateMachineService();

    const handler = new OnCertificateExtractedHandler(
      repository,
      auditRepo,
      stateMachine,
    );

    const event = new CertificateExtractedEvent(
      'nonexistent',
      ExtractedCertificateData.create({
        fullName: 'Test',
        certificateName: 'Test',
        issuingOrganization: 'Test',
        ocrConfidence: 0.5,
      }),
      'user-1',
    );

    await handler.handle(event);

    expect(repository.findById).toHaveBeenCalledWith('nonexistent');
    expect(repository.save).not.toHaveBeenCalled();
    expect(auditRepo.recordAuditEvent).not.toHaveBeenCalled();
  });
});

import { OnCertificateExtractionFailedHandler } from '../on-certificate-extraction-failed.handler';
import { CertificateExtractionFailedEvent } from '../../events/certificate-extraction-failed.event';
import { TrainerVerificationStateMachineService } from '../../services/trainer-verification-state-machine.service';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import { AdvancedVerificationStatus } from '../../../domain/value-objects/advanced-verification-status.vo';

describe('OnCertificateExtractionFailedHandler', () => {
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

  it('transitions to certificate_extraction_failed and audits', async () => {
    const verification = makeVerification();
    const repository = {
      findById: jest.fn().mockResolvedValue(verification),
      findByUserId: jest.fn(),
      listPending: jest.fn(),
      listPendingAdvanced: jest.fn(),
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

    const handler = new OnCertificateExtractionFailedHandler(
      repository,
      auditRepo,
      stateMachine,
    );

    const event = new CertificateExtractionFailedEvent(
      verification.id,
      'unreadable_document',
      'Could not parse certificate',
      'user-1',
    );

    await handler.handle(event);

    expect(repository.save).toHaveBeenCalledWith(verification);
    expect(verification.advancedStatus).toBe('certificate_extraction_failed');
    expect(auditRepo.recordStatusChange).toHaveBeenCalledTimes(1);
    expect(auditRepo.recordAuditEvent).toHaveBeenCalledTimes(1);
    expect(auditRepo.recordAuditEvent.mock.calls[0][0].metadata).toEqual({
      errorCode: 'unreadable_document',
      errorMessage: 'Could not parse certificate',
    });
  });
});

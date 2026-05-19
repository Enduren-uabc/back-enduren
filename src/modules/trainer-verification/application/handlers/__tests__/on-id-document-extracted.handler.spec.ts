import { OnIdDocumentExtractedHandler } from '../on-id-document-extracted.handler';
import { IdDocumentExtractedEvent } from '../../events/id-document-extracted.event';
import { ExtractedIdData } from '../../../domain/value-objects/extracted-id-data.vo';
import { TrainerVerificationStateMachineService } from '../../services/trainer-verification-state-machine.service';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import { AdvancedVerificationStatus } from '../../../domain/value-objects/advanced-verification-status.vo';

describe('OnIdDocumentExtractedHandler', () => {
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
      advancedStatus: 'id_extraction_pending',
    });
  };

  it('transitions to id_extracted and persists data', async () => {
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

    const handler = new OnIdDocumentExtractedHandler(
      repository,
      auditRepo,
      stateMachine,
    );

    const extractedData = ExtractedIdData.create({
      fullName: 'Juan Perez',
      documentType: 'INE',
      ocrConfidence: 0.95,
    });

    const event = new IdDocumentExtractedEvent(
      verification.id,
      extractedData,
      'user-1',
    );

    await handler.handle(event);

    expect(repository.findById).toHaveBeenCalledWith(verification.id);
    expect(verification.extractedIdData).toBe(extractedData);
    expect(repository.save).toHaveBeenCalledWith(verification);
    expect(auditRepo.recordAuditEvent).toHaveBeenCalledTimes(1);
  });
});

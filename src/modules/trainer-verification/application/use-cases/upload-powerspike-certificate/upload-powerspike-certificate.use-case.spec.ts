import { UploadPowerspikeCertificateUseCase } from './upload-powerspike-certificate.use-case';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import { TrainerVerificationStateMachineService } from '../../services/trainer-verification-state-machine.service';
import { AdvancedVerificationStatus } from '../../../domain/value-objects/advanced-verification-status.vo';

describe('UploadPowerspikeCertificateUseCase', () => {
  const makeDraft = () => {
    return TrainerVerification.reconstitute({
      id: crypto.randomUUID(),
      userId: 'user-1',
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
      advancedStatus: 'draft',
    });
  };

  it('publishes ExtractCertificateCommand after upload', async () => {
    const verification = makeDraft();
    const repository = {
      findByUserId: jest.fn().mockResolvedValue(verification),
      findById: jest.fn(),
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
    const storageService = {
      uploadFile: jest.fn().mockResolvedValue({
        containerName: 'certificates',
        blobPath: 'path/file.pdf',
        fileName: 'file.pdf',
        fileSize: 1000,
      }),
      delete: jest.fn(),
      getSignedUrl: jest.fn(),
    };
    const commandBus = { publish: jest.fn() };

    const useCase = new UploadPowerspikeCertificateUseCase(
      repository,
      auditRepo,
      stateMachine,
      storageService as any,
      commandBus as any,
    );

    const result = await useCase.execute({
      actor: { userId: 'user-1', role: 'trainer' },
      certificateName: 'CPT',
      issuingOrganization: 'NASM',
      file: {
        buffer: Buffer.from('test'),
        mimetype: 'application/pdf',
        originalname: 'cert.pdf',
        fieldname: 'certificateDocument',
        encoding: '7bit',
        size: 1000,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      },
    });

    expect(result.advancedStatus).toBe('certificate_extraction_pending');
    expect(commandBus.publish).toHaveBeenCalledTimes(1);
    expect(commandBus.publish.mock.calls[0][0].constructor.name).toBe(
      'ExtractCertificateCommand',
    );
  });
});

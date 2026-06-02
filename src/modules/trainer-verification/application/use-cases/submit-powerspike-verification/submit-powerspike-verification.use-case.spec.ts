import { SubmitPowerspikeVerificationUseCase } from './submit-powerspike-verification.use-case';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import { TrainerVerificationStateMachineService } from '../../services/trainer-verification-state-machine.service';
import { RiskScoringService } from '../../services/risk-scoring.service';
import { AdvancedVerificationStatus } from '../../../domain/value-objects/advanced-verification-status.vo';
import { TrainerVerificationDomainError } from '../../../domain/errors/trainer-verification.domain-error';
import { ScoringResult } from '../../../domain/value-objects/scoring-result.vo';

describe('SubmitPowerspikeVerificationUseCase', () => {
  const makeScoringResult = () =>
    ScoringResult.create({
      riskScore: 85,
      riskLevel: 'low',
      recommendedAction: 'quick_review',
      summary: 'Test',
      positiveSignals: ['ID vigente'],
      alerts: [],
      overrides: [],
    });

  const makeVerification = (status: AdvancedVerificationStatus) => {
    return TrainerVerification.reconstitute({
      id: crypto.randomUUID(),
      userId: 'user-1',
      verificationStatus: 'pending',
      specialtyKeys: ['strength'],
      yearsOfExperience: 3,
      shortBio: 'Bio',
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
      advancedStatus: status,
    });
  };

  it('accepts id_extracted status and runs scoring', async () => {
    const verification = makeVerification('id_extracted');
    const repository = {
      findByUserId: jest.fn().mockResolvedValue(verification),
      findById: jest.fn(),
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
    const specialtyRepo = {
      findByKeys: jest.fn().mockResolvedValue([
        {
          key: 'strength',
          displayName: 'Strength',
          category: 'training',
          iconUrl: null,
          createdAt: new Date(),
        },
      ]),
      findAll: jest.fn(),
    };
    const stateMachine = new TrainerVerificationStateMachineService();
    const riskScoring = {
      calculate: jest.fn().mockReturnValue(makeScoringResult()),
    };

    const eventEmitter = { emit: jest.fn() };

    const useCase = new SubmitPowerspikeVerificationUseCase(
      repository,
      auditRepo,
      specialtyRepo,
      stateMachine,
      riskScoring as any,
      eventEmitter,
    );

    const result = await useCase.execute({
      actor: { userId: 'user-1', role: 'trainer', email: 'user1@test.com' },
      specialtyKeys: ['strength'],
      yearsOfExperience: 3,
      shortBio: 'Bio actualizada',
      idDocumentNumber: 'ID-456',
    });

    expect(riskScoring.calculate).toHaveBeenCalledTimes(1);
    expect(result.riskLevel).toBe('low');
    expect(verification.scoringResult).toBeDefined();
  });

  it('accepts id_extraction_failed status with audit alert', async () => {
    const verification = makeVerification('id_extraction_failed');
    const repository = {
      findByUserId: jest.fn().mockResolvedValue(verification),
      findById: jest.fn(),
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
    const specialtyRepo = {
      findByKeys: jest.fn().mockResolvedValue([
        {
          key: 'strength',
          displayName: 'Strength',
          category: 'training',
          iconUrl: null,
          createdAt: new Date(),
        },
      ]),
      findAll: jest.fn(),
    };
    const stateMachine = new TrainerVerificationStateMachineService();
    const riskScoring = {
      calculate: jest.fn().mockReturnValue(makeScoringResult()),
    };

    const eventEmitter = { emit: jest.fn() };

    const useCase = new SubmitPowerspikeVerificationUseCase(
      repository,
      auditRepo,
      specialtyRepo,
      stateMachine,
      riskScoring as any,
      eventEmitter,
    );

    const result = await useCase.execute({
      actor: { userId: 'user-1', role: 'trainer', email: 'user1@test.com' },
      specialtyKeys: ['strength'],
      yearsOfExperience: 3,
      shortBio: 'Bio',
      idDocumentNumber: 'ID-456',
    });

    expect(result.riskLevel).toBe('low');
    const alertCall = auditRepo.recordAuditEvent.mock.calls.find(
      (call: any[]) => call[0]?.metadata?.idExtractionFailed === true,
    );
    expect(alertCall).toBeDefined();
  });

  it('rejects invalid status', async () => {
    const verification = makeVerification('certificate_extracted');
    const repository = {
      findByUserId: jest.fn().mockResolvedValue(verification),
      findById: jest.fn(),
      listPending: jest.fn(),
      listPendingAdvanced: jest.fn(),
      findDetailById: jest.fn(),
      save: jest.fn(),
    };
    const auditRepo = {
      recordStatusChange: jest.fn(),
      recordAuditEvent: jest.fn(),
      getStatusHistory: jest.fn(),
      getAuditEvents: jest.fn(),
    };
    const specialtyRepo = {
      findByKeys: jest.fn().mockResolvedValue([
        {
          key: 'strength',
          displayName: 'Strength',
          category: 'training',
          iconUrl: null,
          createdAt: new Date(),
        },
      ]),
      findAll: jest.fn(),
    };
    const stateMachine = new TrainerVerificationStateMachineService();
    const riskScoring = { calculate: jest.fn() };

    const eventEmitter = { emit: jest.fn() };

    const useCase = new SubmitPowerspikeVerificationUseCase(
      repository,
      auditRepo,
      specialtyRepo,
      stateMachine,
      riskScoring as any,
      eventEmitter,
    );

    await expect(
      useCase.execute({
        actor: { userId: 'user-1', role: 'trainer', email: 'user1@test.com' },
        specialtyKeys: ['strength'],
        yearsOfExperience: 3,
        shortBio: 'Bio',
        idDocumentNumber: 'ID-456',
      }),
    ).rejects.toThrow(TrainerVerificationDomainError);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  StartVerificationReviewUseCase,
  StartVerificationReviewInput,
} from './start-verification-review.use-case';
import {
  TrainerVerificationRepository,
  TRAINER_VERIFICATION_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification.repository.port';
import {
  TrainerVerificationAuditRepository,
  TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
} from '../../../domain/repositories/trainer-verification-audit.repository.port';
import { TrainerVerificationStateMachineService } from '../../services/trainer-verification-state-machine.service';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import { TrainerVerification } from '../../../domain/entities/trainer-verification.entity';
import { CurrentActor } from '../../ports/current-actor.port';

describe('StartVerificationReviewUseCase', () => {
  let useCase: StartVerificationReviewUseCase;
  let verificationRepository: jest.Mocked<TrainerVerificationRepository>;
  let auditRepository: jest.Mocked<TrainerVerificationAuditRepository>;
  let stateMachine: jest.Mocked<TrainerVerificationStateMachineService>;

  const adminActor: CurrentActor = { userId: 'admin-1', role: 'admin' };

  function createMockVerification(
    overrides: Partial<TrainerVerification> = {},
  ): TrainerVerification {
    const base = {
      id: 'verif-1',
      userId: 'user-1',
      verificationStatus: 'pending' as const,
      specialtyKeys: ['strength'],
      yearsOfExperience: 5,
      shortBio: 'Bio',
      idDocumentNumber: 'DOC123',
      idDocuments: [],
      certificates: [],
      rejectionReason: null,
      verifiedBy: null,
      verifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      advancedStatus: 'manual_review_pending' as any,
      statusHistory: [],
      extractedCertificateData: null,
      extractedIdData: null,
      scoringResult: null,
      assignedReviewerId: null,
    };

    const mock = { ...base, ...overrides } as TrainerVerification;
    mock.assignReviewer = jest.fn().mockImplementation(function (
      adminId: string,
    ) {
      if (this.assignedReviewerId && this.assignedReviewerId !== adminId) {
        throw new TrainerVerificationDomainError(
          TrainerVerificationErrorCode.ALREADY_ASSIGNED,
          'Another reviewer is already assigned',
        );
      }
      this.assignedReviewerId = adminId;
    });
    return mock;
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartVerificationReviewUseCase,
        {
          provide: TRAINER_VERIFICATION_REPOSITORY_PORT,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
            listPending: jest.fn(),
            findDetailById: jest.fn(),
            findByUserId: jest.fn(),
            listPendingAdvanced: jest.fn(),
          },
        },
        {
          provide: TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
          useValue: {
            recordStatusChange: jest.fn(),
            recordAuditEvent: jest.fn(),
          },
        },
        {
          provide: TrainerVerificationStateMachineService,
          useValue: {
            transition: jest.fn().mockReturnValue({ id: 'change-1' }),
          },
        },
      ],
    }).compile();

    useCase = module.get(StartVerificationReviewUseCase);
    verificationRepository = module.get(TRAINER_VERIFICATION_REPOSITORY_PORT);
    auditRepository = module.get(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT);
    stateMachine = module.get(TrainerVerificationStateMachineService);
  });

  it('transitions to manual_review_in_progress and assigns reviewer', async () => {
    const verification = createMockVerification();
    verificationRepository.findById.mockResolvedValue(verification);

    const input: StartVerificationReviewInput = {
      actor: adminActor,
      verificationId: 'verif-1',
    };

    const result = await useCase.execute(input);

    expect(result.verificationId).toBe('verif-1');
    expect(result.advancedStatus).toBe('manual_review_in_progress');
    expect(result.assignedReviewerId).toBe('admin-1');
    expect(verification.assignReviewer).toHaveBeenCalledWith('admin-1');
    expect(stateMachine.transition).toHaveBeenCalledWith(
      verification,
      'manual_review_in_progress',
      { actorId: 'admin-1', actorType: 'admin' },
      expect.any(String),
    );
    expect(auditRepository.recordStatusChange).toHaveBeenCalled();
    expect(auditRepository.recordAuditEvent).toHaveBeenCalled();
  });

  it('throws if verification not found', async () => {
    verificationRepository.findById.mockResolvedValue(null);

    const input: StartVerificationReviewInput = {
      actor: adminActor,
      verificationId: 'nonexistent',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      TrainerVerificationDomainError,
    );
  });

  it('throws if advancedStatus is not manual_review_pending', async () => {
    const verification = createMockVerification({
      advancedStatus: 'draft',
    });
    verificationRepository.findById.mockResolvedValue(verification);

    const input: StartVerificationReviewInput = {
      actor: adminActor,
      verificationId: 'verif-1',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Cannot start review');
  });

  it('throws if already assigned to another reviewer', async () => {
    const verification = createMockVerification({
      assignedReviewerId: 'other-admin',
    });
    verificationRepository.findById.mockResolvedValue(verification);

    const input: StartVerificationReviewInput = {
      actor: adminActor,
      verificationId: 'verif-1',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'Another reviewer is already assigned',
    );
  });
});

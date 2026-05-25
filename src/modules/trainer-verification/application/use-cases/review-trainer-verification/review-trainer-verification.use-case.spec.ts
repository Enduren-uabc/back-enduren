import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ReviewTrainerVerificationUseCase,
  ReviewTrainerVerificationInput,
} from './review-trainer-verification.use-case';
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
  TRAINER_FLOW_CONFIG_PORT,
  TrainerFlowConfigPort,
} from '../../ports/trainer-flow-config.port';
import {
  UserRepository,
  USER_REPOSITORY_PORT,
} from '../../../../users/domain/repositories/user.repository';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from '../../../domain/errors/trainer-verification.domain-error';
import { CurrentActor } from '../../ports/current-actor.port';

describe('ReviewTrainerVerificationUseCase', () => {
  let useCase: ReviewTrainerVerificationUseCase;
  let verificationRepository: jest.Mocked<TrainerVerificationRepository>;
  let auditRepository: jest.Mocked<TrainerVerificationAuditRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let stateMachine: jest.Mocked<TrainerVerificationStateMachineService>;
  let flowConfig: jest.Mocked<TrainerFlowConfigPort>;

  const adminActor: CurrentActor = { userId: 'admin-1', role: 'admin', email: 'admin@endure.com' };

  function createMockVerification(
    overrides: Record<string, unknown> = {},
  ): any {
    return {
      id: 'verif-1',
      userId: 'user-1',
      verificationStatus: 'pending',
      advancedStatus: 'manual_review_in_progress',
      assignedReviewerId: 'admin-1',
      approve: jest.fn(),
      reject: jest.fn(),
      ...overrides,
    };
  }

  function createMockUser(overrides: Record<string, unknown> = {}): any {
    return {
      id: 'user-1',
      email: 'user1@test.com',
      username: 'testuser',
      role: 'user',
      trainerCode: null,
      upgradeToTrainer: jest.fn(),
      setTrainerCode: jest.fn(),
      save: jest.fn(),
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewTrainerVerificationUseCase,
        {
          provide: TRAINER_VERIFICATION_REPOSITORY_PORT,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
            findByUserId: jest.fn(),
            listPending: jest.fn(),
            findDetailById: jest.fn(),
            listPendingAdvanced: jest.fn(),
          },
        },
        {
          provide: USER_REPOSITORY_PORT,
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT,
          useValue: {
            recordStatusChange: jest.fn(),
            recordAuditEvent: jest.fn(),
            getStatusHistory: jest.fn(),
            getAuditEvents: jest.fn(),
          },
        },
        {
          provide: TrainerVerificationStateMachineService,
          useValue: {
            transition: jest.fn().mockReturnValue({ id: 'change-1' }),
          },
        },
        {
          provide: TRAINER_FLOW_CONFIG_PORT,
          useValue: {
            isPowerspikeEnabled: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(ReviewTrainerVerificationUseCase);
    verificationRepository = module.get(TRAINER_VERIFICATION_REPOSITORY_PORT);
    auditRepository = module.get(TRAINER_VERIFICATION_AUDIT_REPOSITORY_PORT);
    userRepository = module.get(USER_REPOSITORY_PORT);
    stateMachine = module.get(TrainerVerificationStateMachineService);
    flowConfig = module.get(TRAINER_FLOW_CONFIG_PORT);
  });

  describe('Powerspike mode', () => {
    beforeEach(() => {
      (flowConfig.isPowerspikeEnabled as jest.Mock).mockReturnValue(true);
    });

    it('approves verification and upgrades user', async () => {
      const verification = createMockVerification();
      const trainer = createMockUser({ role: 'user' });
      verificationRepository.findById.mockResolvedValue(verification);
      verificationRepository.save.mockResolvedValue(verification);
      userRepository.findById.mockResolvedValue(trainer);
      userRepository.save.mockResolvedValue(trainer);

      const input: ReviewTrainerVerificationInput = {
        actor: adminActor,
        verificationId: 'verif-1',
        decision: 'approved',
      };

      const result = await useCase.execute(input);

      expect(result.decision).toBe('approved');
      expect(result.advancedStatus).toBeDefined();
      expect(stateMachine.transition).toHaveBeenCalledWith(
        verification,
        'approved',
        expect.any(Object),
        expect.any(String),
      );
      expect(auditRepository.recordStatusChange).toHaveBeenCalled();
      expect(auditRepository.recordAuditEvent).toHaveBeenCalled();
      expect(trainer.upgradeToTrainer).toHaveBeenCalled();
    });

    it('rejects verification without upgrading user', async () => {
      const verification = createMockVerification();
      const trainer = createMockUser({ role: 'user' });
      verificationRepository.findById.mockResolvedValue(verification);
      verificationRepository.save.mockResolvedValue(verification);
      userRepository.findById.mockResolvedValue(trainer);

      const result = await useCase.execute({
        actor: adminActor,
        verificationId: 'verif-1',
        decision: 'rejected',
        internalComment: 'Not qualified',
      });

      expect(result.decision).toBe('rejected');
      expect(trainer.upgradeToTrainer).not.toHaveBeenCalled();
    });

    it('accepts correction_required with userVisibleMessage', async () => {
      const verification = createMockVerification();
      const trainer = createMockUser({ role: 'user' });
      verificationRepository.findById.mockResolvedValue(verification);
      verificationRepository.save.mockResolvedValue(verification);
      userRepository.findById.mockResolvedValue(trainer);

      const result = await useCase.execute({
        actor: adminActor,
        verificationId: 'verif-1',
        decision: 'correction_required',
        userVisibleMessage: 'Please upload a clearer certificate',
        correctionType: 'certificate',
      });

      expect(result.decision).toBe('correction_required');
      expect(stateMachine.transition).toHaveBeenCalledWith(
        verification,
        'correction_required',
        expect.any(Object),
        expect.any(String),
      );
    });

    it('rejects correction_required without userVisibleMessage', async () => {
      const verification = createMockVerification();
      verificationRepository.findById.mockResolvedValue(verification);

      await expect(
        useCase.execute({
          actor: adminActor,
          verificationId: 'verif-1',
          decision: 'correction_required',
        }),
      ).rejects.toThrow('A user-visible message is required');
    });

    it('rejects if advancedStatus is not manual_review_in_progress', async () => {
      const verification = createMockVerification({
        advancedStatus: 'draft',
      });
      verificationRepository.findById.mockResolvedValue(verification);

      await expect(
        useCase.execute({
          actor: adminActor,
          verificationId: 'verif-1',
          decision: 'approved',
        }),
      ).rejects.toThrow('Cannot review in status');
    });

    it('rejects if assigned to another reviewer', async () => {
      const verification = createMockVerification({
        assignedReviewerId: 'other-admin',
      });
      verificationRepository.findById.mockResolvedValue(verification);

      await expect(
        useCase.execute({
          actor: adminActor,
          verificationId: 'verif-1',
          decision: 'approved',
        }),
      ).rejects.toThrow('assigned to another reviewer');
    });

    it('saves verification before upgrading user', async () => {
      const verification = createMockVerification();
      const trainer = createMockUser({ role: 'user' });
      verificationRepository.findById.mockResolvedValue(verification);
      verificationRepository.save.mockResolvedValue(verification);
      userRepository.findById.mockResolvedValue(trainer);

      const saveOrder: string[] = [];
      verificationRepository.save.mockImplementation(() => {
        saveOrder.push('verification');
        return Promise.resolve(verification);
      });
      userRepository.save.mockImplementation(() => {
        saveOrder.push('user');
        return Promise.resolve(trainer);
      });

      await useCase.execute({
        actor: adminActor,
        verificationId: 'verif-1',
        decision: 'approved',
      });

      expect(saveOrder[0]).toBe('verification');
      expect(saveOrder[1]).toBe('user');
    });

    it('throws if verification not found', async () => {
      verificationRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          actor: adminActor,
          verificationId: 'nonexistent',
          decision: 'approved',
        }),
      ).rejects.toThrow(TrainerVerificationDomainError);
    });
  });

  describe('Legacy mode', () => {
    beforeEach(() => {
      (flowConfig.isPowerspikeEnabled as jest.Mock).mockReturnValue(false);
    });

    it('approves verification and upgrades user', async () => {
      const verification = createMockVerification({
        advancedStatus: undefined,
      });
      verification.approve = jest.fn();
      verification.reject = jest.fn();
      const trainer = createMockUser({ role: 'user' });
      verificationRepository.findById.mockResolvedValue(verification);
      verificationRepository.save.mockResolvedValue(verification);
      userRepository.findById.mockResolvedValue(trainer);

      const result = await useCase.execute({
        actor: adminActor,
        verificationId: 'verif-1',
        decision: 'approved',
      });

      expect(result.decision).toBe('approved');
      expect(result.legacyStatus).toBe('pending');
      expect(verification.approve).toHaveBeenCalledWith('admin-1');
      expect(trainer.upgradeToTrainer).toHaveBeenCalled();
    });

    it('rejects verification with reason', async () => {
      const verification = createMockVerification({
        advancedStatus: undefined,
      });
      verification.approve = jest.fn();
      verification.reject = jest.fn();
      verificationRepository.findById.mockResolvedValue(verification);
      verificationRepository.save.mockResolvedValue(verification);
      const trainer = createMockUser({ role: 'user' });
      userRepository.findById.mockResolvedValue(trainer);

      const result = await useCase.execute({
        actor: adminActor,
        verificationId: 'verif-1',
        decision: 'rejected',
        rejectionReason: 'Not qualified',
      });

      expect(result.decision).toBe('rejected');
      expect(verification.reject).toHaveBeenCalledWith(
        'admin-1',
        'Not qualified',
      );
    });

    it('rejects correction_required in legacy mode', async () => {
      const verification = createMockVerification({
        advancedStatus: undefined,
      });
      verificationRepository.findById.mockResolvedValue(verification);

      await expect(
        useCase.execute({
          actor: adminActor,
          verificationId: 'verif-1',
          decision: 'correction_required',
        }),
      ).rejects.toThrow('not supported for this verification type');
    });

    it('throws if user not found in legacy mode', async () => {
      const verification = createMockVerification({
        advancedStatus: undefined,
      });
      verificationRepository.findById.mockResolvedValue(verification);
      userRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          actor: adminActor,
          verificationId: 'verif-1',
          decision: 'approved',
        }),
      ).rejects.toThrow('User not found');
    });

    it('does not call state machine or audit in legacy mode', async () => {
      const verification = createMockVerification({
        advancedStatus: undefined,
      });
      verification.approve = jest.fn();
      verificationRepository.findById.mockResolvedValue(verification);
      verificationRepository.save.mockResolvedValue(verification);
      const trainer = createMockUser({ role: 'trainer' });
      userRepository.findById.mockResolvedValue(trainer);

      await useCase.execute({
        actor: adminActor,
        verificationId: 'verif-1',
        decision: 'approved',
      });

      expect(stateMachine.transition).not.toHaveBeenCalled();
      expect(auditRepository.recordStatusChange).not.toHaveBeenCalled();
      expect(auditRepository.recordAuditEvent).not.toHaveBeenCalled();
    });
  });
});

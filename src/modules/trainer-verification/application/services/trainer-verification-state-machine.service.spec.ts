import { TrainerVerification } from '../../domain/entities/trainer-verification.entity';
import { TrainerVerificationStateMachineService } from './trainer-verification-state-machine.service';
import { TrainerVerificationDomainError } from '../../domain/errors/trainer-verification.domain-error';

function makeVerification(): TrainerVerification {
  return TrainerVerification.create({
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    specialtyKeys: ['strength'],
    yearsOfExperience: 2,
    shortBio: 'Bio valida',
    idDocumentNumber: 'ID-1234',
    idDocuments: [
      {
        id: crypto.randomUUID(),
        documentType: 'passport',
        containerName: 'test',
        fileUrl: 'url',
        fileName: 'doc.pdf',
        fileSize: 100,
        uploadedAt: new Date(),
      },
    ],
    certificates: [
      {
        id: crypto.randomUUID(),
        name: 'Cert',
        issuingOrganization: 'Org',
        containerName: 'test',
        documentUrl: 'url',
        fileName: 'cert.pdf',
        fileSize: 200,
        uploadedAt: new Date(),
      },
    ],
  });
}

describe('TrainerVerificationStateMachineService', () => {
  const service = new TrainerVerificationStateMachineService();

  describe('canTransition', () => {
    it('allows valid transitions from draft', () => {
      expect(service.canTransition('draft', 'certificate_uploaded')).toBe(true);
      expect(service.canTransition('draft', 'id_uploaded')).toBe(true);
      expect(service.canTransition('draft', 'cancelled_by_user')).toBe(true);
      expect(service.canTransition('draft', 'approved')).toBe(false);
    });

    it('allows valid transitions from manual_review_in_progress', () => {
      expect(
        service.canTransition('manual_review_in_progress', 'approved'),
      ).toBe(true);
      expect(
        service.canTransition('manual_review_in_progress', 'rejected'),
      ).toBe(true);
      expect(
        service.canTransition(
          'manual_review_in_progress',
          'correction_required',
        ),
      ).toBe(true);
      expect(service.canTransition('manual_review_in_progress', 'draft')).toBe(
        false,
      );
    });

    it('blocks transitions from terminal states', () => {
      expect(service.canTransition('approved', 'rejected')).toBe(false);
      expect(service.canTransition('rejected', 'approved')).toBe(false);
      expect(service.canTransition('cancelled_by_user', 'draft')).toBe(false);
    });
  });

  describe('transition', () => {
    it('transitions a verification and updates legacy status', () => {
      const verification = makeVerification();

      const change = service.transition(
        verification,
        'certificate_uploaded',
        { actorId: 'user-1', actorType: 'user' },
        'Certificate uploaded by user',
      );

      expect(verification.advancedStatus).toBe('certificate_uploaded');
      expect(verification.verificationStatus).toBe('pending');
      expect(verification.statusHistory).toHaveLength(1);
      expect(change.newStatus).toBe('certificate_uploaded');
      expect(change.previousStatus).toBe('draft');
      expect(change.reason).toBe('Certificate uploaded by user');
    });

    it('derives legacy approved from advanced approved', () => {
      const verification = makeVerification();
      verification.advancedStatus = 'manual_review_in_progress';

      service.transition(verification, 'approved', {
        actorId: 'admin-1',
        actorType: 'admin',
      });

      expect(verification.verificationStatus).toBe('approved');
    });

    it('derives legacy rejected from advanced correction_required', () => {
      const verification = makeVerification();
      verification.advancedStatus = 'manual_review_in_progress';

      service.transition(verification, 'correction_required', {
        actorId: 'admin-1',
        actorType: 'admin',
      });

      expect(verification.verificationStatus).toBe('rejected');
    });

    it('throws on invalid transition', () => {
      const verification = makeVerification();

      expect(() =>
        service.transition(verification, 'approved', {
          actorId: 'user-1',
          actorType: 'user',
        }),
      ).toThrow(TrainerVerificationDomainError);
    });
  });

  describe('deriveLegacyStatus', () => {
    it('returns approved for advanced approved', () => {
      expect(service.deriveLegacyStatus('approved')).toBe('approved');
    });

    it('returns rejected for advanced rejected', () => {
      expect(service.deriveLegacyStatus('rejected')).toBe('rejected');
    });

    it('returns pending for all intermediate states', () => {
      expect(service.deriveLegacyStatus('draft')).toBe('pending');
      expect(service.deriveLegacyStatus('certificate_uploaded')).toBe(
        'pending',
      );
      expect(service.deriveLegacyStatus('manual_review_pending')).toBe(
        'pending',
      );
    });
  });
});

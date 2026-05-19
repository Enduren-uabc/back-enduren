import { TrainerCertificate } from './entities/trainer-certificate.entity';
import { TrainerIdDocument } from './entities/trainer-id-document.entity';
import { TrainerVerification } from './entities/trainer-verification.entity';
import {
  TrainerVerificationDomainError,
  TrainerVerificationErrorCode,
} from './errors/trainer-verification.domain-error';

function makeDocument(): TrainerIdDocument {
  return TrainerIdDocument.create(
    crypto.randomUUID(),
    'passport',
    'trainer-verification-docs',
    'verifications/user/id/document.pdf',
    'document.pdf',
    1200,
  );
}

function makeCertificate(): TrainerCertificate {
  return TrainerCertificate.create(
    crypto.randomUUID(),
    'Certified Personal Trainer',
    'NASM',
    'trainer-verification-docs',
    'verifications/user/certificates/certificate.pdf',
    'certificate.pdf',
    2400,
  );
}

describe('TrainerVerification domain', () => {
  it('creates a pending verification with valid professional data', () => {
    const verification = TrainerVerification.create(
      crypto.randomUUID(),
      crypto.randomUUID(),
      ['strength', 'hypertrophy'],
      5,
      'Entrenador especializado en fuerza.',
      'ID-1234',
      [makeDocument()],
      [makeCertificate()],
    );

    expect(verification.verificationStatus).toBe('pending');
    expect(verification.specialtyKeys).toEqual(['strength', 'hypertrophy']);
  });

  it('rejects verifications without required files', () => {
    expect(() =>
      TrainerVerification.create(
        crypto.randomUUID(),
        crypto.randomUUID(),
        ['strength'],
        1,
        'Bio valida',
        'ID-1234',
        [],
        [makeCertificate()],
      ),
    ).toThrow(TrainerVerificationDomainError);
  });

  it('supports pending to rejected and rejected to pending transitions', () => {
    const verification = TrainerVerification.create(
      crypto.randomUUID(),
      crypto.randomUUID(),
      ['strength'],
      2,
      'Bio valida',
      'ID-1234',
      [makeDocument()],
      [makeCertificate()],
    );

    verification.reject(crypto.randomUUID(), 'Documentos ilegibles');
    expect(verification.verificationStatus).toBe('rejected');

    verification.resubmit({ shortBio: 'Bio actualizada' });
    expect(verification.verificationStatus).toBe('pending');
    expect(verification.rejectionReason).toBeNull();
  });

  it('does not allow changes after approval', () => {
    const verification = TrainerVerification.create(
      crypto.randomUUID(),
      crypto.randomUUID(),
      ['strength'],
      2,
      'Bio valida',
      'ID-1234',
      [makeDocument()],
      [makeCertificate()],
    );

    verification.approve(crypto.randomUUID());

    expect(() => verification.reject(crypto.randomUUID(), 'No aplica')).toThrow(
      expect.objectContaining({
        code: TrainerVerificationErrorCode.VERIFICATION_ALREADY_APPROVED,
      }),
    );
  });

  describe('assignReviewer', () => {
    it('assigns a reviewer to a verification', () => {
      const verification = TrainerVerification.reconstitute({
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        verificationStatus: 'pending',
        specialtyKeys: ['strength'],
        yearsOfExperience: 2,
        shortBio: 'Bio valida',
        idDocumentNumber: 'ID-1234',
        idDocuments: [makeDocument()],
        certificates: [makeCertificate()],
        rejectionReason: null,
        verifiedBy: null,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        advancedStatus: 'manual_review_pending',
        assignedReviewerId: null,
      });

      verification.assignReviewer('admin-1');
      expect(verification.assignedReviewerId).toBe('admin-1');
    });

    it('allows same reviewer to be reassigned', () => {
      const verification = TrainerVerification.reconstitute({
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        verificationStatus: 'pending',
        specialtyKeys: ['strength'],
        yearsOfExperience: 2,
        shortBio: 'Bio valida',
        idDocumentNumber: 'ID-1234',
        idDocuments: [makeDocument()],
        certificates: [makeCertificate()],
        rejectionReason: null,
        verifiedBy: null,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        advancedStatus: 'manual_review_pending',
        assignedReviewerId: 'admin-1',
      });

      verification.assignReviewer('admin-1');
      expect(verification.assignedReviewerId).toBe('admin-1');
    });

    it('rejects if another reviewer is already assigned', () => {
      const verification = TrainerVerification.reconstitute({
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        verificationStatus: 'pending',
        specialtyKeys: ['strength'],
        yearsOfExperience: 2,
        shortBio: 'Bio valida',
        idDocumentNumber: 'ID-1234',
        idDocuments: [makeDocument()],
        certificates: [makeCertificate()],
        rejectionReason: null,
        verifiedBy: null,
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        advancedStatus: 'manual_review_pending',
        assignedReviewerId: 'admin-1',
      });

      expect(() => verification.assignReviewer('admin-2')).toThrow(
        expect.objectContaining({
          code: TrainerVerificationErrorCode.ALREADY_ASSIGNED,
        }),
      );
    });
  });
});

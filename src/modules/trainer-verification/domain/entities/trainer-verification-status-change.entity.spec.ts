import { TrainerVerificationStatusChange } from './trainer-verification-status-change.entity';

describe('TrainerVerificationStatusChange', () => {
  it('creates a status change with all properties', () => {
    const change = TrainerVerificationStatusChange.create({
      id: 'change-1',
      verificationId: 'verif-1',
      previousStatus: 'draft',
      newStatus: 'certificate_uploaded',
      actorId: 'user-1',
      actorType: 'user',
      reason: 'User uploaded certificate',
      metadata: { fileName: 'cert.pdf' },
      createdAt: new Date('2026-05-18T10:00:00Z'),
    });

    expect(change.id).toBe('change-1');
    expect(change.verificationId).toBe('verif-1');
    expect(change.previousStatus).toBe('draft');
    expect(change.newStatus).toBe('certificate_uploaded');
    expect(change.actorId).toBe('user-1');
    expect(change.actorType).toBe('user');
    expect(change.reason).toBe('User uploaded certificate');
    expect(change.metadata).toEqual({ fileName: 'cert.pdf' });
  });

  it('reconstitutes from props', () => {
    const change = TrainerVerificationStatusChange.reconstitute({
      id: 'change-2',
      verificationId: 'verif-1',
      previousStatus: null,
      newStatus: 'draft',
      actorId: 'system',
      actorType: 'system',
      createdAt: new Date(),
    });

    expect(change.previousStatus).toBeNull();
    expect(change.reason).toBeUndefined();
    expect(change.metadata).toBeUndefined();
  });
});

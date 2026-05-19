import { TrainerVerificationAuditEvent } from './trainer-verification-audit-event.entity';

describe('TrainerVerificationAuditEvent', () => {
  it('creates an audit event with all properties', () => {
    const event = TrainerVerificationAuditEvent.create({
      id: 'event-1',
      verificationId: 'verif-1',
      eventType: 'document_uploaded',
      actorId: 'user-1',
      actorType: 'user',
      description: 'Certificate document uploaded',
      metadata: { fileSize: 1024 },
      createdAt: new Date('2026-05-18T10:00:00Z'),
    });

    expect(event.id).toBe('event-1');
    expect(event.verificationId).toBe('verif-1');
    expect(event.eventType).toBe('document_uploaded');
    expect(event.actorId).toBe('user-1');
    expect(event.actorType).toBe('user');
    expect(event.description).toBe('Certificate document uploaded');
    expect(event.metadata).toEqual({ fileSize: 1024 });
  });

  it('reconstitutes from props without optional fields', () => {
    const event = TrainerVerificationAuditEvent.reconstitute({
      id: 'event-2',
      verificationId: 'verif-1',
      eventType: 'admin_decision',
      actorId: 'admin-1',
      actorType: 'admin',
      description: 'Approved by admin',
      createdAt: new Date(),
    });

    expect(event.metadata).toBeUndefined();
  });
});

import { TrainerLink } from './trainer-link.entity';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../errors/trainer-link.domain-error';

describe('TrainerLink', () => {
  const validProps = {
    id: 'link-1',
    clientId: 'client-1',
    trainerId: 'trainer-1',
    linkRequestId: 'req-1',
  };

  describe('create', () => {
    it('should create an active link', () => {
      const link = TrainerLink.create(validProps);
      expect(link.id).toBe('link-1');
      expect(link.clientId).toBe('client-1');
      expect(link.trainerId).toBe('trainer-1');
      expect(link.linkRequestId).toBe('req-1');
      expect(link.status).toBe('active');
      expect(link.activatedAt).toBeInstanceOf(Date);
      expect(link.deactivatedAt).toBeNull();
      expect(link.deactivationReason).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persisted data', () => {
      const now = new Date();
      const link = TrainerLink.reconstitute({
        id: 'link-1',
        clientId: 'client-1',
        trainerId: 'trainer-1',
        linkRequestId: 'req-1',
        status: 'inactive',
        activatedAt: now,
        deactivatedAt: now,
        deactivationReason: 'Client request',
        createdAt: now,
        updatedAt: now,
      });
      expect(link.status).toBe('inactive');
      expect(link.deactivationReason).toBe('Client request');
    });
  });

  describe('deactivate', () => {
    it('should transition from active to inactive', () => {
      const link = TrainerLink.create(validProps);
      const deactivated = link.deactivate('No longer needed');
      expect(deactivated.status).toBe('inactive');
      expect(deactivated.deactivatedAt).toBeInstanceOf(Date);
      expect(deactivated.deactivationReason).toBe('No longer needed');
    });

    it('should deactivate without reason', () => {
      const link = TrainerLink.create(validProps);
      const deactivated = link.deactivate();
      expect(deactivated.status).toBe('inactive');
      expect(deactivated.deactivationReason).toBeNull();
    });

    it('should throw if already inactive', () => {
      const link = TrainerLink.create(validProps);
      const deactivated = link.deactivate();
      expect(() => deactivated.deactivate()).toThrow(TrainerLinkDomainError);
      expect(() => deactivated.deactivate()).toThrow(
        expect.objectContaining({
          code: TrainerLinkErrorCode.LINK_ALREADY_INACTIVE,
        }),
      );
    });
  });
});

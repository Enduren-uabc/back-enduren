import { TrainerLinkRequest } from './trainer-link-request.entity';
import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../errors/trainer-link.domain-error';

describe('TrainerLinkRequest', () => {
  const validProps = {
    id: 'req-1',
    clientId: 'client-1',
    trainerId: 'trainer-1',
  };

  describe('create', () => {
    it('should create a pending link request', () => {
      const request = TrainerLinkRequest.create(validProps);
      expect(request.id).toBe('req-1');
      expect(request.clientId).toBe('client-1');
      expect(request.trainerId).toBe('trainer-1');
      expect(request.status).toBe('pendiente');
      expect(request.message).toBeNull();
      expect(request.rejectionReason).toBeNull();
      expect(request.cancelledAt).toBeNull();
      expect(request.respondedAt).toBeNull();
      expect(request.respondedById).toBeNull();
    });

    it('should create with optional message', () => {
      const request = TrainerLinkRequest.create({
        ...validProps,
        message: 'Hello!',
      });
      expect(request.message).toBe('Hello!');
    });

    it('should set message to null when not provided', () => {
      const request = TrainerLinkRequest.create(validProps);
      expect(request.message).toBeNull();
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from persisted data', () => {
      const now = new Date();
      const request = TrainerLinkRequest.reconstitute({
        id: 'req-1',
        clientId: 'client-1',
        trainerId: 'trainer-1',
        status: 'aceptada',
        message: 'Hi',
        rejectionReason: null,
        cancelledAt: null,
        respondedAt: now,
        respondedById: 'trainer-1',
        createdAt: now,
        updatedAt: now,
      });
      expect(request.status).toBe('aceptada');
      expect(request.respondedById).toBe('trainer-1');
    });
  });

  describe('accept', () => {
    it('should transition from pendiente to aceptada', () => {
      const request = TrainerLinkRequest.create(validProps);
      const accepted = request.accept('trainer-1');
      expect(accepted.status).toBe('aceptada');
      expect(accepted.respondedById).toBe('trainer-1');
      expect(accepted.respondedAt).toBeInstanceOf(Date);
    });

    it('should throw if not pendiente', () => {
      const request = TrainerLinkRequest.create(validProps);
      const accepted = request.accept('trainer-1');
      expect(() => accepted.accept('trainer-1')).toThrow(
        TrainerLinkDomainError,
      );
      expect(() => accepted.accept('trainer-1')).toThrow(
        expect.objectContaining({
          code: TrainerLinkErrorCode.LINK_REQUEST_CANNOT_BE_ACCEPTED,
        }),
      );
    });

    it('should throw if already rejected', () => {
      const request = TrainerLinkRequest.create(validProps);
      const rejected = request.reject('trainer-1');
      expect(() => rejected.accept('trainer-1')).toThrow(
        TrainerLinkDomainError,
      );
    });

    it('should throw if already cancelled', () => {
      const request = TrainerLinkRequest.create(validProps);
      const cancelled = request.cancel();
      expect(() => cancelled.accept('trainer-1')).toThrow(
        TrainerLinkDomainError,
      );
    });
  });

  describe('reject', () => {
    it('should transition from pendiente to rechazada with reason', () => {
      const request = TrainerLinkRequest.create(validProps);
      const rejected = request.reject('trainer-1', 'Not interested');
      expect(rejected.status).toBe('rechazada');
      expect(rejected.rejectionReason).toBe('Not interested');
      expect(rejected.respondedById).toBe('trainer-1');
    });

    it('should reject without reason', () => {
      const request = TrainerLinkRequest.create(validProps);
      const rejected = request.reject('trainer-1');
      expect(rejected.status).toBe('rechazada');
      expect(rejected.rejectionReason).toBeNull();
    });

    it('should throw if not pendiente', () => {
      const request = TrainerLinkRequest.create(validProps);
      const accepted = request.accept('trainer-1');
      expect(() => accepted.reject('trainer-1')).toThrow(
        TrainerLinkDomainError,
      );
    });
  });

  describe('cancel', () => {
    it('should transition from pendiente to cancelada', () => {
      const request = TrainerLinkRequest.create(validProps);
      const cancelled = request.cancel();
      expect(cancelled.status).toBe('cancelada');
      expect(cancelled.cancelledAt).toBeInstanceOf(Date);
    });

    it('should throw if not pendiente', () => {
      const request = TrainerLinkRequest.create(validProps);
      const accepted = request.accept('trainer-1');
      expect(() => accepted.cancel()).toThrow(TrainerLinkDomainError);
    });

    it('should throw if already rejected', () => {
      const request = TrainerLinkRequest.create(validProps);
      const rejected = request.reject('trainer-1');
      expect(() => rejected.cancel()).toThrow(TrainerLinkDomainError);
    });
  });
});

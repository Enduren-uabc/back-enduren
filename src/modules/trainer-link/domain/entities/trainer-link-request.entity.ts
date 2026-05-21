import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../errors/trainer-link.domain-error';
import { LinkRequestStatus } from '../value-objects/link-status.vo';

export interface TrainerLinkRequestProps {
  id: string;
  clientId: string;
  trainerId: string;
  status: LinkRequestStatus;
  message: string | null;
  rejectionReason: string | null;
  cancelledAt: Date | null;
  respondedAt: Date | null;
  respondedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TrainerLinkRequest {
  public readonly id: string;
  public readonly clientId: string;
  public readonly trainerId: string;
  public readonly status: LinkRequestStatus;
  public readonly message: string | null;
  public readonly rejectionReason: string | null;
  public readonly cancelledAt: Date | null;
  public readonly respondedAt: Date | null;
  public readonly respondedById: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: TrainerLinkRequestProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.trainerId = props.trainerId;
    this.status = props.status;
    this.message = props.message;
    this.rejectionReason = props.rejectionReason;
    this.cancelledAt = props.cancelledAt;
    this.respondedAt = props.respondedAt;
    this.respondedById = props.respondedById;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: {
    id: string;
    clientId: string;
    trainerId: string;
    message?: string;
  }): TrainerLinkRequest {
    const now = new Date();
    return new TrainerLinkRequest({
      id: props.id,
      clientId: props.clientId,
      trainerId: props.trainerId,
      status: 'pendiente',
      message: props.message ?? null,
      rejectionReason: null,
      cancelledAt: null,
      respondedAt: null,
      respondedById: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(
    props: TrainerLinkRequestProps,
  ): TrainerLinkRequest {
    return new TrainerLinkRequest(props);
  }

  public accept(respondedById: string): TrainerLinkRequest {
    if (this.status !== 'pendiente') {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.LINK_REQUEST_CANNOT_BE_ACCEPTED,
        `Link request cannot be accepted in status: ${this.status}`,
      );
    }
    const now = new Date();
    return new TrainerLinkRequest({
      ...this,
      status: 'aceptada',
      respondedAt: now,
      respondedById,
      updatedAt: now,
    });
  }

  public reject(respondedById: string, reason?: string): TrainerLinkRequest {
    if (this.status !== 'pendiente') {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.LINK_REQUEST_CANNOT_BE_REJECTED,
        `Link request cannot be rejected in status: ${this.status}`,
      );
    }
    const now = new Date();
    return new TrainerLinkRequest({
      ...this,
      status: 'rechazada',
      rejectionReason: reason ?? null,
      respondedAt: now,
      respondedById,
      updatedAt: now,
    });
  }

  public cancel(): TrainerLinkRequest {
    if (this.status !== 'pendiente') {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.LINK_REQUEST_CANNOT_BE_CANCELLED,
        `Link request cannot be cancelled in status: ${this.status}`,
      );
    }
    const now = new Date();
    return new TrainerLinkRequest({
      ...this,
      status: 'cancelada',
      cancelledAt: now,
      updatedAt: now,
    });
  }
}

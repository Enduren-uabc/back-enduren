import {
  TrainerLinkDomainError,
  TrainerLinkErrorCode,
} from '../errors/trainer-link.domain-error';
import { LinkStatus } from '../value-objects/link-status.vo';

export interface TrainerLinkProps {
  id: string;
  clientId: string;
  trainerId: string;
  linkRequestId: string;
  status: LinkStatus;
  activatedAt: Date;
  deactivatedAt: Date | null;
  deactivationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TrainerLink {
  public readonly id: string;
  public readonly clientId: string;
  public readonly trainerId: string;
  public readonly linkRequestId: string;
  public readonly status: LinkStatus;
  public readonly activatedAt: Date;
  public readonly deactivatedAt: Date | null;
  public readonly deactivationReason: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: TrainerLinkProps) {
    this.id = props.id;
    this.clientId = props.clientId;
    this.trainerId = props.trainerId;
    this.linkRequestId = props.linkRequestId;
    this.status = props.status;
    this.activatedAt = props.activatedAt;
    this.deactivatedAt = props.deactivatedAt;
    this.deactivationReason = props.deactivationReason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: {
    id: string;
    clientId: string;
    trainerId: string;
    linkRequestId: string;
  }): TrainerLink {
    const now = new Date();
    return new TrainerLink({
      id: props.id,
      clientId: props.clientId,
      trainerId: props.trainerId,
      linkRequestId: props.linkRequestId,
      status: 'active',
      activatedAt: now,
      deactivatedAt: null,
      deactivationReason: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: TrainerLinkProps): TrainerLink {
    return new TrainerLink(props);
  }

  public deactivate(reason?: string): TrainerLink {
    if (this.status !== 'active') {
      throw new TrainerLinkDomainError(
        TrainerLinkErrorCode.LINK_ALREADY_INACTIVE,
        'Link is already inactive',
      );
    }
    const now = new Date();
    return new TrainerLink({
      ...this,
      status: 'inactive',
      deactivatedAt: now,
      deactivationReason: reason ?? null,
      updatedAt: now,
    });
  }
}

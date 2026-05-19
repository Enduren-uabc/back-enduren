import { AdvancedVerificationStatus } from '../value-objects/advanced-verification-status.vo';

export interface TrainerVerificationStatusChangeProps {
  id: string;
  verificationId: string;
  previousStatus: AdvancedVerificationStatus | null;
  newStatus: AdvancedVerificationStatus;
  actorId: string;
  actorType: 'user' | 'system' | 'admin' | 'external_service';
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class TrainerVerificationStatusChange {
  public readonly id: string;
  public readonly verificationId: string;
  public readonly previousStatus: AdvancedVerificationStatus | null;
  public readonly newStatus: AdvancedVerificationStatus;
  public readonly actorId: string;
  public readonly actorType: 'user' | 'system' | 'admin' | 'external_service';
  public readonly reason: string | undefined;
  public readonly metadata: Record<string, unknown> | undefined;
  public readonly createdAt: Date;

  private constructor(props: TrainerVerificationStatusChangeProps) {
    this.id = props.id;
    this.verificationId = props.verificationId;
    this.previousStatus = props.previousStatus;
    this.newStatus = props.newStatus;
    this.actorId = props.actorId;
    this.actorType = props.actorType;
    this.reason = props.reason;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  static create(
    props: TrainerVerificationStatusChangeProps,
  ): TrainerVerificationStatusChange {
    return new TrainerVerificationStatusChange(props);
  }

  static reconstitute(
    props: TrainerVerificationStatusChangeProps,
  ): TrainerVerificationStatusChange {
    return new TrainerVerificationStatusChange(props);
  }
}

export interface TrainerVerificationAuditEventProps {
  id: string;
  verificationId: string;
  eventType:
    | 'document_uploaded'
    | 'extraction_failed'
    | 'risk_calculated'
    | 'admin_access'
    | 'admin_decision'
    | 'correction_requested'
    | 'user_cancelled'
    | 'extraction_not_configured'
    | 'document_extracted'
    | 'certificate_data_confirmed';
  actorId: string;
  actorType: 'user' | 'system' | 'admin' | 'external_service';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class TrainerVerificationAuditEvent {
  public readonly id: string;
  public readonly verificationId: string;
  public readonly eventType: TrainerVerificationAuditEventProps['eventType'];
  public readonly actorId: string;
  public readonly actorType: 'user' | 'system' | 'admin' | 'external_service';
  public readonly description: string;
  public readonly metadata: Record<string, unknown> | undefined;
  public readonly createdAt: Date;

  private constructor(props: TrainerVerificationAuditEventProps) {
    this.id = props.id;
    this.verificationId = props.verificationId;
    this.eventType = props.eventType;
    this.actorId = props.actorId;
    this.actorType = props.actorType;
    this.description = props.description;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  static create(
    props: TrainerVerificationAuditEventProps,
  ): TrainerVerificationAuditEvent {
    return new TrainerVerificationAuditEvent(props);
  }

  static reconstitute(
    props: TrainerVerificationAuditEventProps,
  ): TrainerVerificationAuditEvent {
    return new TrainerVerificationAuditEvent(props);
  }
}

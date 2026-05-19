export type AlertSeverity = 'info' | 'medium' | 'high' | 'critical';

export type AlertCode =
  | 'CERTIFICATE_WITHOUT_FOLIO'
  | 'CERTIFICATE_WITHOUT_QR'
  | 'CERTIFICATE_WITHOUT_EXPIRATION'
  | 'UNKNOWN_INSTITUTION'
  | 'LOW_OCR_CONFIDENCE'
  | 'PARTIAL_NAME_MATCH'
  | 'LOW_NAME_MATCH'
  | 'NO_NAME_MATCH'
  | 'EXPIRED_ID'
  | 'UNDERAGE_USER'
  | 'DUPLICATED_CERTIFICATE'
  | 'DUPLICATED_ID'
  | 'FOLIO_BELONGS_TO_ANOTHER_PERSON'
  | 'QR_DATA_MISMATCH'
  | 'MANIPULATED_DOCUMENT'
  | 'LIVENESS_FAILED'
  | 'REPEATED_LIVENESS_FAILURE'
  | 'DOCUMENT_NOT_RELATED_TO_FITNESS'
  | 'DOCUMENT_EXTRACTION_FAILED';

export interface RiskAlertProps {
  code: AlertCode;
  severity: AlertSeverity;
  message: string;
}

export class RiskAlert {
  public readonly code: AlertCode;
  public readonly severity: AlertSeverity;
  public readonly message: string;

  private constructor(props: RiskAlertProps) {
    this.code = props.code;
    this.severity = props.severity;
    this.message = props.message;
  }

  static create(props: RiskAlertProps): RiskAlert {
    return new RiskAlert(props);
  }

  static reconstitute(props: RiskAlertProps): RiskAlert {
    return new RiskAlert(props);
  }
}

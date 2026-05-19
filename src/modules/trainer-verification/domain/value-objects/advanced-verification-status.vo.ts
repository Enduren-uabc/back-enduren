export const ADVANCED_VERIFICATION_STATUSES = [
  'draft',
  'certificate_uploaded',
  'certificate_extraction_pending',
  'certificate_extracted',
  'certificate_extraction_failed',
  'id_uploaded',
  'id_extraction_pending',
  'id_extracted',
  'id_extraction_failed',
  'identity_compared',
  'risk_calculated',
  'manual_review_pending',
  'manual_review_in_progress',
  'correction_required',
  'approved',
  'rejected',
  'cancelled_by_user',
  'expired',
  'blocked_for_risk',
] as const;

export type AdvancedVerificationStatus =
  (typeof ADVANCED_VERIFICATION_STATUSES)[number];

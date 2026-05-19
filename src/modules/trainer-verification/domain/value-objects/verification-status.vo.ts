export const VERIFICATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

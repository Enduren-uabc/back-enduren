import { AdvancedVerificationStatus } from './advanced-verification-status.vo';
import { VerificationStatus } from './verification-status.vo';

export function advancedToLegacy(
  advancedStatus: AdvancedVerificationStatus,
): VerificationStatus {
  switch (advancedStatus) {
    case 'approved':
      return 'approved';
    case 'rejected':
    case 'cancelled_by_user':
    case 'expired':
    case 'blocked_for_risk':
    case 'correction_required':
      return 'rejected';
    default:
      return 'pending';
  }
}

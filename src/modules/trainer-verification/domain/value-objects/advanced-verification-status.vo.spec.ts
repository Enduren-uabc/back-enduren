import { ADVANCED_VERIFICATION_STATUSES } from './advanced-verification-status.vo';

describe('AdvancedVerificationStatus value object', () => {
  it('contains all expected statuses', () => {
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('draft');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('certificate_uploaded');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain(
      'certificate_extraction_pending',
    );
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('certificate_extracted');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain(
      'certificate_extraction_failed',
    );
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('id_uploaded');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('id_extraction_pending');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('id_extracted');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('id_extraction_failed');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('identity_compared');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('risk_calculated');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('manual_review_pending');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain(
      'manual_review_in_progress',
    );
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('correction_required');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('approved');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('rejected');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('cancelled_by_user');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('expired');
    expect(ADVANCED_VERIFICATION_STATUSES).toContain('blocked_for_risk');
  });

  it('has exactly 19 statuses', () => {
    expect(ADVANCED_VERIFICATION_STATUSES).toHaveLength(19);
  });
});

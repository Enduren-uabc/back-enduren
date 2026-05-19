import { advancedToLegacy } from './advanced-to-legacy-mapper';

describe('advancedToLegacy mapper', () => {
  it('maps approved to approved', () => {
    expect(advancedToLegacy('approved')).toBe('approved');
  });

  it('maps rejected to rejected', () => {
    expect(advancedToLegacy('rejected')).toBe('rejected');
  });

  it('maps terminal negative states to rejected', () => {
    expect(advancedToLegacy('cancelled_by_user')).toBe('rejected');
    expect(advancedToLegacy('expired')).toBe('rejected');
    expect(advancedToLegacy('blocked_for_risk')).toBe('rejected');
    expect(advancedToLegacy('correction_required')).toBe('rejected');
  });

  it('maps all intermediate states to pending', () => {
    const intermediateStates = [
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
    ] as const;

    for (const status of intermediateStates) {
      expect(advancedToLegacy(status)).toBe('pending');
    }
  });
});

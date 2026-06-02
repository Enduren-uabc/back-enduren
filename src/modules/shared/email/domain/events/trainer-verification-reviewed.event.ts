export class TrainerVerificationReviewedEvent {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly decision: 'approved' | 'rejected' | 'correction_required',
    public readonly message?: string,
  ) {}
}

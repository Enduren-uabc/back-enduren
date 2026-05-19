export class ReviewVerificationResponseDto {
  verificationId!: string;
  decision!: string;
  legacyStatus!: string;
  advancedStatus?: string;
}

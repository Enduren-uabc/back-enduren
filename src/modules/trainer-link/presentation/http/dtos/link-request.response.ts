export class LinkRequestResponseDto {
  id!: string;
  clientId!: string;
  trainerId!: string;
  status!: string;
  message!: string | null;
  rejectionReason!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

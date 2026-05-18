import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewVerificationRequestDto {
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;
}

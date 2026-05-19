import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewVerificationRequestDto {
  @IsIn(['approved', 'rejected', 'correction_required'])
  decision!: 'approved' | 'rejected' | 'correction_required';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalComment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  userVisibleMessage?: string;

  @IsOptional()
  @IsIn(['certificate', 'id_document', 'liveness', 'other'])
  correctionType?: 'certificate' | 'id_document' | 'liveness' | 'other';
}

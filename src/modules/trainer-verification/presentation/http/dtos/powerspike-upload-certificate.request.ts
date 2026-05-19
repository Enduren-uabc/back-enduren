import { Allow, IsOptional } from 'class-validator';

export class PowerspikeUploadCertificateRequestDto {
  @IsOptional()
  @Allow()
  certificateName?: unknown;

  @IsOptional()
  @Allow()
  issuingOrganization?: unknown;
}

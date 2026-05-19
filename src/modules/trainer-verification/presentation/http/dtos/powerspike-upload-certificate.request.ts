import { Allow } from 'class-validator';

export class PowerspikeUploadCertificateRequestDto {
  @Allow()
  certificateName!: unknown;

  @Allow()
  issuingOrganization!: unknown;
}

import { Allow } from 'class-validator';

export class ConfirmCertificateDataRequestDto {
  @Allow()
  certificateName!: unknown;

  @Allow()
  issuingOrganization!: unknown;
}

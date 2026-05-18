import { Allow } from 'class-validator';

export class SubmitVerificationRequestDto {
  @Allow()
  specialtyKeys!: unknown;

  @Allow()
  yearsOfExperience!: unknown;

  @Allow()
  shortBio!: unknown;

  @Allow()
  idDocumentNumber!: unknown;

  @Allow()
  idDocumentTypes?: unknown;

  @Allow()
  certificates?: unknown;

  @Allow()
  certificateNames?: unknown;

  @Allow()
  certificateIssuingOrganizations?: unknown;
}

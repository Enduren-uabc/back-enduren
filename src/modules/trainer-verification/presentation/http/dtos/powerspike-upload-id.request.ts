import { Allow } from 'class-validator';

export class PowerspikeUploadIdRequestDto {
  @Allow()
  idDocumentType!: unknown;
}

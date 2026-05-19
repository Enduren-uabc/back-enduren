import { Allow } from 'class-validator';

export class PowerspikeSubmitRequestDto {
  @Allow()
  specialtyKeys!: unknown;

  @Allow()
  yearsOfExperience!: unknown;

  @Allow()
  shortBio!: unknown;

  @Allow()
  idDocumentNumber!: unknown;
}

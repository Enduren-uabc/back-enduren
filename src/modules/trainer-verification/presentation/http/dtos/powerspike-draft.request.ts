import { Allow } from 'class-validator';

export class PowerspikeDraftRequestDto {
  @Allow()
  specialtyKeys?: unknown;

  @Allow()
  yearsOfExperience?: unknown;

  @Allow()
  shortBio?: unknown;
}

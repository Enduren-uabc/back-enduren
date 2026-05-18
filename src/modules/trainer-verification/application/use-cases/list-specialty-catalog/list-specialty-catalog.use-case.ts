import { Inject, Injectable } from '@nestjs/common';
import {
  SpecialtyCatalogRepository,
  SPECIALTY_CATALOG_REPOSITORY_PORT,
} from '../../../domain/repositories/specialty-catalog.repository.port';

export interface ListSpecialtyCatalogOutput {
  specialties: {
    key: string;
    displayName: string;
    category: string;
    iconUrl: string | null;
  }[];
}

@Injectable()
export class ListSpecialtyCatalogUseCase {
  constructor(
    @Inject(SPECIALTY_CATALOG_REPOSITORY_PORT)
    private readonly specialtyCatalogRepository: SpecialtyCatalogRepository,
  ) {}

  async execute(): Promise<ListSpecialtyCatalogOutput> {
    const specialties = await this.specialtyCatalogRepository.findAll();
    return {
      specialties: specialties.map((specialty) => ({
        key: specialty.key,
        displayName: specialty.displayName,
        category: specialty.category,
        iconUrl: specialty.iconUrl,
      })),
    };
  }
}

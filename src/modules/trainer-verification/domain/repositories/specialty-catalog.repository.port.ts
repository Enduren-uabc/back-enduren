import { SpecialtyCatalogEntry } from '../entities/specialty-catalog-entry.entity';

export const SPECIALTY_CATALOG_REPOSITORY_PORT = Symbol(
  'SPECIALTY_CATALOG_REPOSITORY_PORT',
);

export interface SpecialtyCatalogRepository {
  findAll(): Promise<SpecialtyCatalogEntry[]>;
  findByKeys(keys: string[]): Promise<SpecialtyCatalogEntry[]>;
}

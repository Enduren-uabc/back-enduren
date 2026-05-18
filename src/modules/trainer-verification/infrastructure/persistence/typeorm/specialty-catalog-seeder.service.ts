import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpecialtyCatalogTypeormEntity } from './entities/specialty-catalog-typeorm.entity';

const SPECIALTY_CATALOG_SEED = [
  { key: 'strength', displayName: 'Fuerza', category: 'resistance' },
  { key: 'hypertrophy', displayName: 'Hipertrofia', category: 'resistance' },
  {
    key: 'weight_loss',
    displayName: 'Perdida de peso',
    category: 'conditioning',
  },
  {
    key: 'endurance',
    displayName: 'Resistencia cardiovascular',
    category: 'conditioning',
  },
  {
    key: 'rehabilitation',
    displayName: 'Rehabilitacion',
    category: 'clinical',
  },
  { key: 'flexibility', displayName: 'Flexibilidad', category: 'mobility' },
  {
    key: 'functional',
    displayName: 'Entrenamiento funcional',
    category: 'resistance',
  },
  {
    key: 'sports',
    displayName: 'Entrenamiento deportivo',
    category: 'performance',
  },
  { key: 'yoga', displayName: 'Yoga', category: 'mind_body' },
  { key: 'pilates', displayName: 'Pilates', category: 'mind_body' },
  { key: 'crossfit', displayName: 'CrossFit', category: 'conditioning' },
  {
    key: 'general_fitness',
    displayName: 'Acondicionamiento general',
    category: 'conditioning',
  },
] as const;

@Injectable()
export class SpecialtyCatalogSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(SpecialtyCatalogTypeormEntity)
    private readonly specialtyCatalogRepository: Repository<SpecialtyCatalogTypeormEntity>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.specialtyCatalogRepository.upsert(
      SPECIALTY_CATALOG_SEED.map((entry) => ({
        ...entry,
        iconUrl: null,
        createdAt: new Date(),
      })),
      ['key'],
    );
  }
}

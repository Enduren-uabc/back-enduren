import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SpecialtyCatalogEntry } from '../../../../domain/entities/specialty-catalog-entry.entity';
import { SpecialtyCatalogRepository } from '../../../../domain/repositories/specialty-catalog.repository.port';
import { SpecialtyCatalogTypeormEntity } from '../entities/specialty-catalog-typeorm.entity';

@Injectable()
export class TypeormSpecialtyCatalogRepository implements SpecialtyCatalogRepository {
  constructor(
    @InjectRepository(SpecialtyCatalogTypeormEntity)
    private readonly ormRepo: Repository<SpecialtyCatalogTypeormEntity>,
  ) {}

  async findAll(): Promise<SpecialtyCatalogEntry[]> {
    const entities = await this.ormRepo.find({
      order: { category: 'ASC', displayName: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByKeys(keys: string[]): Promise<SpecialtyCatalogEntry[]> {
    if (keys.length === 0) {
      return [];
    }
    const entities = await this.ormRepo.find({
      where: { key: In(keys) },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  private toDomain(
    entity: SpecialtyCatalogTypeormEntity,
  ): SpecialtyCatalogEntry {
    return SpecialtyCatalogEntry.reconstitute({
      key: entity.key,
      displayName: entity.displayName,
      category: entity.category,
      iconUrl: entity.iconUrl,
      createdAt: entity.createdAt,
    });
  }
}

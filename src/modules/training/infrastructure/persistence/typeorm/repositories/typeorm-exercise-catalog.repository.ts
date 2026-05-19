import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ExerciseCatalogRepository } from '../../../../domain/repositories/exercise-catalog.repository';
import { ExerciseCatalogEntry } from '../../../../domain/entities/exercise-catalog-entry.entity';
import { ExerciseCatalogTypeormEntity } from '../entities/exercise-catalog-typeorm.entity';

@Injectable()
export class TypeormExerciseCatalogRepository implements ExerciseCatalogRepository {
  constructor(
    @InjectRepository(ExerciseCatalogTypeormEntity)
    private readonly ormRepo: Repository<ExerciseCatalogTypeormEntity>,
  ) {}

  public async findAll(query: {
    search?: string;
    category?: string;
    primaryMuscleGroup?: string;
    equipment?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ExerciseCatalogEntry[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }
    if (query.category) {
      where.category = query.category;
    }
    if (query.primaryMuscleGroup) {
      where.primaryMuscleGroup = query.primaryMuscleGroup;
    }
    if (query.equipment) {
      where.equipment = query.equipment;
    }

    const [ormEntities, total] = await this.ormRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { name: 'ASC' },
    });

    const data = ormEntities.map((e) =>
      ExerciseCatalogEntry.reconstitute(
        e.id,
        e.name,
        e.category as ExerciseCatalogEntry['category'],
        e.primaryMuscleGroup,
        e.equipment as ExerciseCatalogEntry['equipment'],
        e.videoUrl,
        e.imageUrl,
      ),
    );

    return { data, total, page, limit };
  }
}

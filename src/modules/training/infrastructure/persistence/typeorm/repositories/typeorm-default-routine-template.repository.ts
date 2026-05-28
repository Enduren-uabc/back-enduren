import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DefaultRoutineTemplateRepository,
  DefaultRoutineTemplateDayDto,
} from '../../../../domain/repositories/default-routine-template.repository';
import { DefaultRoutineTemplateTypeormEntity } from '../entities/default-routine-template-typeorm.entity';

@Injectable()
export class TypeormDefaultRoutineTemplateRepository implements DefaultRoutineTemplateRepository {
  constructor(
    @InjectRepository(DefaultRoutineTemplateTypeormEntity)
    private readonly ormRepo: Repository<DefaultRoutineTemplateTypeormEntity>,
  ) {}

  public async findByLevelAndSplit(
    experienceLevel: string,
    splitKey?: string | null,
  ): Promise<DefaultRoutineTemplateDayDto[]> {
    const where: any = { experienceLevel };

    if (splitKey) {
      where.splitKey = splitKey;
    } else {
      where.splitKey = null;
    }

    const templates = await this.ormRepo.find({
      where,
      relations: ['exercises'],
      order: {
        displayOrder: 'ASC',
      },
    });

    return templates.map((t) => ({
      name: t.name,
      dayOfWeek: t.dayOfWeek,
      exercises: (t.exercises ?? [])
        .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
        .map((ex) => ({
          catalogId: ex.exerciseCatalogId,
          name: ex.exerciseName,
          setsCount: ex.setsCount,
          initialReps: ex.initialReps,
          initialWeight: Number(ex.initialWeight),
        })),
    }));
  }
}

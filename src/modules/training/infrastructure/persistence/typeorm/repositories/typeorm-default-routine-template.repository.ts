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
          order: ex.exerciseOrder,
        })),
    }));
  }

  public async findAllGrouped(level?: string): Promise<
    Array<{
      experienceLevel: string;
      splitKey: string | null;
      name: string;
      dayOfWeek: string;
      displayOrder: number;
      exerciseCount: number;
      totalSets: number;
    }>
  > {
    let query = this.ormRepo
      .createQueryBuilder('t')
      .leftJoin('t.exercises', 'e')
      .select([
        't.experienceLevel',
        't.splitKey',
        't.name',
        't.dayOfWeek',
        't.displayOrder',
      ])
      .addSelect('COUNT(e.id)', 'exerciseCount')
      .addSelect('COALESCE(SUM(e.setsCount), 0)', 'totalSets')
      .groupBy('t.id')
      .addGroupBy('t.experienceLevel')
      .addGroupBy('t.splitKey')
      .addGroupBy('t.name')
      .addGroupBy('t.dayOfWeek')
      .addGroupBy('t.displayOrder')
      .orderBy('t.experienceLevel', 'ASC')
      .addOrderBy('t.displayOrder', 'ASC');

    if (level) {
      query = query.where('t.experienceLevel = :level', { level });
    }

    const results = await query.getRawMany();

    return results.map((r: any) => ({
      experienceLevel: r.t_experience_level,
      splitKey: r.t_split_key,
      name: r.t_name,
      dayOfWeek: r.t_day_of_week,
      displayOrder: Number(r.t_display_order),
      exerciseCount: Number(r.exerciseCount ?? 0),
      totalSets: Number(r.totalSets ?? 0),
    }));
  }
}

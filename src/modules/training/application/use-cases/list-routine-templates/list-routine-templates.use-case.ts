import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_ROUTINE_TEMPLATE_REPOSITORY_PORT,
  DefaultRoutineTemplateRepository,
} from '../../../domain/repositories/default-routine-template.repository';

export interface RoutineTemplateSummary {
  id: string;
  experienceLevel: string;
  splitKey: string | null;
  name: string;
  dayCount: number;
  exerciseCount: number;
  totalSets: number;
  description: string;
}

export interface ListRoutineTemplatesInput {
  level?: string;
  page?: number;
  limit?: number;
}

export interface ListRoutineTemplatesOutput {
  templates: RoutineTemplateSummary[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ListRoutineTemplatesUseCase {
  constructor(
    @Inject(DEFAULT_ROUTINE_TEMPLATE_REPOSITORY_PORT)
    private readonly templateRepository: DefaultRoutineTemplateRepository,
  ) {}

  public async execute(
    input?: ListRoutineTemplatesInput,
  ): Promise<ListRoutineTemplatesOutput> {
    const rawTemplates = await this.templateRepository.findAllGrouped(
      input?.level,
    );

    const grouped = new Map<
      string,
      {
        experienceLevel: string;
        splitKey: string | null;
        name: string;
        dayCount: number;
        exerciseCount: number;
        totalSets: number;
      }
    >();

    for (const t of rawTemplates) {
      const key = `${t.experienceLevel}-${t.splitKey ?? 'default'}`;
      const existing = grouped.get(key);

      if (!existing) {
        const namePrefix = t.name ? t.name.split(' — ')[0] : t.name;
        grouped.set(key, {
          experienceLevel: t.experienceLevel,
          splitKey: t.splitKey,
          name: namePrefix,
          dayCount: 1,
          exerciseCount: t.exerciseCount,
          totalSets: t.totalSets,
        });
      } else {
        existing.dayCount += 1;
        existing.exerciseCount += t.exerciseCount;
        existing.totalSets += t.totalSets;
      }
    }

    const allTemplates: RoutineTemplateSummary[] = Array.from(
      grouped.values(),
    ).map((g) => ({
      id: `${g.experienceLevel}-${g.splitKey ?? 'default'}`,
      experienceLevel: g.experienceLevel,
      splitKey: g.splitKey,
      name: g.name,
      dayCount: g.dayCount,
      exerciseCount: g.exerciseCount,
      totalSets: g.totalSets,
      description: `${g.dayCount} dia${g.dayCount !== 1 ? 's' : ''} · ${g.exerciseCount} ejercicios`,
    }));

    const page = input?.page ?? 1;
    const limit = input?.limit ?? 20;
    const total = allTemplates.length;
    const start = (page - 1) * limit;
    const templates = allTemplates.slice(start, start + limit);

    return { templates, total, page, limit };
  }
}

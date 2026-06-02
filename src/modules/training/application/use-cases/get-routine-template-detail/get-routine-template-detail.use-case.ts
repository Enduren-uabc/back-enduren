import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_ROUTINE_TEMPLATE_REPOSITORY_PORT,
  DefaultRoutineTemplateRepository,
} from '../../../domain/repositories/default-routine-template.repository';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';

export interface RoutineTemplateExercise {
  catalogId: string;
  name: string;
  setsCount: number;
  initialReps: number;
  initialWeight: number;
  order: number;
}

export interface RoutineTemplateDay {
  dayOfWeek: string;
  name: string;
  displayOrder: number;
  exercises: RoutineTemplateExercise[];
}

export interface GetRoutineTemplateDetailOutput {
  id: string;
  experienceLevel: string;
  splitKey: string | null;
  name: string;
  description: string;
  days: RoutineTemplateDay[];
}

@Injectable()
export class GetRoutineTemplateDetailUseCase {
  constructor(
    @Inject(DEFAULT_ROUTINE_TEMPLATE_REPOSITORY_PORT)
    private readonly templateRepository: DefaultRoutineTemplateRepository,
  ) {}

  public async execute(
    templateId: string,
  ): Promise<GetRoutineTemplateDetailOutput> {
    const parts = templateId.split('-');
    const experienceLevel = parts[0];
    const rawSplit = parts.slice(1).join('-') || null;
    const splitKey = rawSplit === 'default' ? null : rawSplit;
    const validLevels = ['beginner', 'intermediate', 'advanced'];

    if (!validLevels.includes(experienceLevel)) {
      throw new RoutineDomainError(
        RoutineErrorCode.TEMPLATE_NOT_FOUND,
        `Template with id "${templateId}" not found`,
      );
    }

    const dayDtos = await this.templateRepository.findByLevelAndSplit(
      experienceLevel,
      splitKey,
    );

    if (dayDtos.length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.TEMPLATE_NOT_FOUND,
        `Template with id "${templateId}" not found`,
      );
    }

    const sortedDays = dayDtos.sort(
      (a, b) => {
        const orderMap: Record<string, number> = {
          monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7,
        };
        return (orderMap[a.dayOfWeek] ?? 0) - (orderMap[b.dayOfWeek] ?? 0);
      },
    );

    const days: RoutineTemplateDay[] = sortedDays.map((d, index) => ({
      dayOfWeek: d.dayOfWeek,
      name: d.name,
      displayOrder: index + 1,
      exercises: d.exercises.map((ex) => ({
        catalogId: ex.catalogId,
        name: ex.name,
        setsCount: ex.setsCount,
        initialReps: ex.initialReps,
        initialWeight: ex.initialWeight,
        order: ex.order,
      })),
    }));

    const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);
    const totalSets = days.reduce(
      (sum, d) => sum + d.exercises.reduce((s, e) => s + e.setsCount, 0),
      0,
    );

    const namePrefix = sortedDays[0]?.name
      ? sortedDays[0].name.split(' — ')[0]
      : '';

    return {
      id: templateId,
      experienceLevel,
      splitKey,
      name: namePrefix,
      description: `${totalExercises} ejercicios · ${totalSets} series`,
      days,
    };
  }
}

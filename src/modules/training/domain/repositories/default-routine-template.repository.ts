export interface DefaultRoutineTemplateDayDto {
  name: string;
  dayOfWeek: string;
  exercises: Array<{
    catalogId: string;
    name: string;
    setsCount: number;
    initialReps: number;
    initialWeight: number;
    order: number;
  }>;
}

export const DEFAULT_ROUTINE_TEMPLATE_REPOSITORY_PORT = Symbol(
  'DEFAULT_ROUTINE_TEMPLATE_REPOSITORY_PORT',
);

export interface DefaultRoutineTemplateRepository {
  findByLevelAndSplit(
    experienceLevel: string,
    splitKey?: string | null,
  ): Promise<DefaultRoutineTemplateDayDto[]>;

  findAllGrouped(level?: string): Promise<
    Array<{
      experienceLevel: string;
      splitKey: string | null;
      name: string;
      dayOfWeek: string;
      displayOrder: number;
      exerciseCount: number;
      totalSets: number;
    }>
  >;
}

import { Routine } from '../../../domain/entities/routine.entity';
import { Exercise } from '../../../domain/entities/exercise.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { TrainingStrategyRepository } from '../../../domain/repositories/training-strategy.repository';
import {
  DefaultRoutineTemplateRepository,
  DefaultRoutineTemplateDayDto,
} from '../../../domain/repositories/default-routine-template.repository';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { RoutineExerciseSet } from '../../../domain/value-objects/routine-exercise-set.value-object';
import { CurrentActor } from '../../ports/current-actor.port';
import { MAX_ROUTINES_PER_USER } from '../create-routine/create-routine.use-case';

export interface CreateDefaultRoutineInput {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  trainingSplitKey?: 'ppl' | 'arnold';
  trainingStrategyKey: string;
}

export interface CreateDefaultRoutineOutput {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  days: Array<{
    dayOfWeek: string;
    exercises: Array<{
      id: string;
      name: string;
      order: number;
      catalogId: string | null;
      sets: Array<{
        id: string;
        setNumber: number;
        reps: number;
        weight: number;
        restSeconds: number | null;
      }>;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileRepository {
  findByUserId(userId: string): Promise<{
    defaultTrainingStrategyKey: string | null;
    experienceLevel: string;
    daysAvailablePerWeek: number;
  } | null>;
}

function getRoutineName(experienceLevel: string, splitKey?: string): string {
  const levelNames: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };
  const levelName = levelNames[experienceLevel] ?? experienceLevel;
  if (splitKey === 'arnold') return `Rutina ${levelName} — Arnold Split`;
  if (splitKey === 'ppl') return `Rutina ${levelName} — PPL`;
  return `Rutina ${levelName}`;
}

export class CreateDefaultRoutineUseCase {
  constructor(
    private readonly routineRepository: RoutineRepository,
    private readonly trainingStrategyRepository: TrainingStrategyRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly templateRepository: DefaultRoutineTemplateRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: CreateDefaultRoutineInput,
  ): Promise<CreateDefaultRoutineOutput> {
    // 1. Verify user profile exists
    const profile = await this.profileRepository.findByUserId(actor.userId);
    if (!profile) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NAME_REQUIRED,
        'User profile not found. Please complete onboarding first.',
        { userId: actor.userId },
      );
    }

    // 2. Select routine configuration from database
    const splitKey =
      input.experienceLevel === 'advanced'
        ? (input.trainingSplitKey ?? 'ppl')
        : null;

    const dayConfigs: DefaultRoutineTemplateDayDto[] =
      await this.templateRepository.findByLevelAndSplit(
        input.experienceLevel,
        splitKey,
      );

    if (dayConfigs.length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NAME_REQUIRED,
        `No default routine templates found for level "${input.experienceLevel}"${splitKey ? ` and split "${splitKey}"` : ''}.`,
        { experienceLevel: input.experienceLevel, splitKey },
      );
    }

    // 3. Enforce routine limit
    const currentCount = await this.routineRepository.countByUserId(
      actor.userId,
    );
    if (currentCount >= MAX_ROUTINES_PER_USER) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_LIMIT_EXCEEDED,
        `You have reached the maximum of ${MAX_ROUTINES_PER_USER} routines. Please delete or modify an existing routine before creating a new one.`,
        { currentCount, limit: MAX_ROUTINES_PER_USER, userId: actor.userId },
      );
    }

    // 4. Load training strategy for set generation
    const strategy = await this.trainingStrategyRepository.findByKey(
      input.trainingStrategyKey,
    );
    if (!strategy) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NAME_REQUIRED,
        `Training strategy "${input.trainingStrategyKey}" not found.`,
        { strategyKey: input.trainingStrategyKey },
      );
    }

    // 5. Build Routine domain entity with days, exercises, and sets
    const routineId = crypto.randomUUID();
    const days: RoutineDay[] = [];

    for (const dayConfig of dayConfigs) {
      let routineDay = RoutineDay.create(dayConfig.dayOfWeek);

      for (let i = 0; i < dayConfig.exercises.length; i++) {
        const exConfig = dayConfig.exercises[i];
        const exerciseId = crypto.randomUUID();

        // Generate sets using the training strategy
        const generatedSets = strategy.generateSets(
          exConfig.setsCount,
          exConfig.initialWeight,
          exConfig.initialReps,
        );

        // Create domain set value objects
        const sets = generatedSets.map((s) =>
          RoutineExerciseSet.create(s.setNumber, s.reps, s.weight),
        );

        // Create exercise with catalogId and configure its sets
        const exercise = Exercise.create(
          exerciseId,
          exConfig.name,
          i + 1,
          exConfig.catalogId,
        );
        const configuredExercise = exercise.configureSets(sets);
        routineDay = routineDay.addExercise(configuredExercise);
      }

      days.push(routineDay);
    }

    // Determine if this is the first routine (auto-activate)
    const isActive = currentCount === 0;

    // Build routine name
    const name = getRoutineName(input.experienceLevel, input.trainingSplitKey);

    const routine = Routine.create(
      routineId,
      name,
      actor.userId,
      days,
      isActive,
      input.trainingStrategyKey,
    );

    // 5. Persist
    const saved = await this.routineRepository.save(routine);

    // 6. Return output
    return {
      id: saved.id,
      name: saved.name,
      userId: saved.userId,
      isActive: saved.isActive,
      days: saved.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        exercises: d.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          order: e.order,
          catalogId: e.catalogId,
          sets: e.sets.map((s) => ({
            id: s.id,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            restSeconds: s.restSeconds,
          })),
        })),
      })),
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}

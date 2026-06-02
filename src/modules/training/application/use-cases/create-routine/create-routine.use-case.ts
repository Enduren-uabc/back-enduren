import { Routine } from '../../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import type { RoutineTargetAudience } from '../../../domain/value-objects/routine-target-audience.value-object';
import { CurrentActor } from '../../ports/current-actor.port';

export const ROUTINE_REPOSITORY_PORT = Symbol('ROUTINE_REPOSITORY_PORT');
export const CURRENT_ACTOR_PORT = Symbol('CURRENT_ACTOR_PORT');

export const PROFILE_REPOSITORY_PORT = Symbol('PROFILE_REPOSITORY_PORT');

export interface ProfileRepository {
  findByUserId(userId: string): Promise<{
    defaultTrainingStrategyKey: string | null;
    experienceLevel?: string;
    daysAvailablePerWeek?: number;
  } | null>;
}

export interface CreateRoutineInput {
  name: string;
  dayOfWeeks: string[];
  targetAudience?: RoutineTargetAudience;
}

export interface CreateRoutineOutput {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  targetAudience: RoutineTargetAudience;
  days: Array<{
    dayOfWeek: string;
    exercises: Array<{
      id: string;
      name: string;
      order: number;
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

export const MAX_ROUTINES_PER_USER = 5;
export const MAX_CLIENT_ROUTINES_PER_TRAINER = 20;

export class CreateRoutineUseCase {
  constructor(
    private readonly routineRepository: RoutineRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: CreateRoutineInput,
  ): Promise<CreateRoutineOutput> {
    // RF-09.0.2: Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NAME_REQUIRED,
        'Routine name is required',
        { name: input.name },
      );
    }

    if (!input.dayOfWeeks || input.dayOfWeeks.length === 0) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DAYS_MINIMUM,
        'Routine must have at least one day',
        { daysCount: input.dayOfWeeks?.length ?? 0 },
      );
    }

    const targetAudience = input.targetAudience ?? 'self';

    if (targetAudience === 'client' && actor.role !== 'trainer') {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_TARGET_AUDIENCE_FORBIDDEN,
        'Only trainers can create routines for clients',
        { userId: actor.userId, role: actor.role ?? null },
      );
    }

    // RF-09.0.1: Validate name uniqueness for user
    const nameExists = await this.routineRepository.existsByNameForUser(
      input.name.trim(),
      actor.userId,
    );
    if (nameExists) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_DUPLICATE_NAME,
        `Routine with name "${input.name.trim()}" already exists for this user`,
        { name: input.name, userId: actor.userId },
      );
    }

    const limit =
      targetAudience === 'client'
        ? MAX_CLIENT_ROUTINES_PER_TRAINER
        : MAX_ROUTINES_PER_USER;
    const currentCount = this.routineRepository.countByUserIdAndTargetAudience
      ? await this.routineRepository.countByUserIdAndTargetAudience(
          actor.userId,
          targetAudience,
        )
      : (await this.routineRepository.findByUserId(actor.userId)).filter(
          (routine) => routine.targetAudience === targetAudience,
        ).length;

    if (currentCount >= limit) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_LIMIT_EXCEEDED,
        `You have reached the maximum of ${limit} routines. Please delete or modify an existing routine before creating a new one.`,
        { currentCount, limit, userId: actor.userId, targetAudience },
      );
    }

    // Create value objects for days (validates day-of-week)
    const days = input.dayOfWeeks.map((dow) => RoutineDay.create(dow));

    // Generate ID
    const id = crypto.randomUUID();

    // RF-09.0.3: Auto-assign first routine as active when user has 0 existing routines
    const isActive = targetAudience === 'self' && currentCount === 0;

    // Auto-assign training strategy from user's profile default
    const profile = await this.profileRepository.findByUserId(actor.userId);
    const defaultTrainingStrategyKey =
      profile?.defaultTrainingStrategyKey ?? null;

    const routine = Routine.create({
      id,
      name: input.name,
      userId: actor.userId,
      days,
      isActive,
      trainingStrategyKey: defaultTrainingStrategyKey,
      targetAudience,
    });

    const saved = await this.routineRepository.save(routine);

    return {
      id: saved.id,
      name: saved.name,
      userId: saved.userId,
      isActive: saved.isActive,
      targetAudience: saved.targetAudience,
      days: saved.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        exercises: d.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          order: e.order,
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

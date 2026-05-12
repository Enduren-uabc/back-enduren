import { Routine } from '../../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { CurrentActor } from '../../ports/current-actor.port';

export const ROUTINE_REPOSITORY_PORT = Symbol('ROUTINE_REPOSITORY_PORT');
export const CURRENT_ACTOR_PORT = Symbol('CURRENT_ACTOR_PORT');

export interface CreateRoutineInput {
  name: string;
  dayOfWeeks: string[];
}

export interface CreateRoutineOutput {
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

export class CreateRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

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

    // RF-09.0.5: Validate routine count limit (max 5)
    // RF-09.0.6: Enhanced error message informing user to delete/modify
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

    // Create value objects for days (validates day-of-week)
    const days = input.dayOfWeeks.map((dow) => RoutineDay.create(dow));

    // Generate ID
    const id = crypto.randomUUID();

    // RF-09.0.3: Auto-assign first routine as active when user has 0 existing routines
    const isActive = currentCount === 0;

    const routine = Routine.create(
      id,
      input.name,
      actor.userId,
      days,
      isActive,
    );

    const saved = await this.routineRepository.save(routine);

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

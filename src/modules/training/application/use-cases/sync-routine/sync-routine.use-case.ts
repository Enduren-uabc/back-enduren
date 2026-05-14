import { Routine } from '../../../domain/entities/routine.entity';
import { Exercise } from '../../../domain/entities/exercise.entity';
import { RoutineDay } from '../../../domain/value-objects/routine-day.value-object';
import { RoutineExerciseSet } from '../../../domain/value-objects/routine-exercise-set.value-object';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface SyncRoutineExerciseSetInput {
  setNumber: number;
  reps: number;
  weight: number;
  restSeconds?: number;
}

export interface SyncRoutineExerciseInput {
  id?: string;
  name: string;
  order: number;
  sets?: SyncRoutineExerciseSetInput[];
}

export interface SyncRoutineDayInput {
  dayOfWeek: string;
  exercises: SyncRoutineExerciseInput[];
}

export interface SyncRoutineInput {
  routineId: string;
  days: SyncRoutineDayInput[];
}

export interface SyncRoutineOutput {
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

export class SyncRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    _actor: CurrentActor,
    input: SyncRoutineInput,
  ): Promise<SyncRoutineOutput> {
    const routine = await this.routineRepository.findById(input.routineId);
    if (!routine) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    // Reconstruct each day from the payload, preserving existing IDs
    const updatedDays = routine.days.map((day) => {
      const dayPayload = input.days.find((d) => d.dayOfWeek === day.dayOfWeek);
      if (!dayPayload) {
        // Day not in payload — keep as-is (days cannot be removed via sync)
        return day;
      }

      const exercises = dayPayload.exercises.map((exPayload) => {
        const existingExercise = exPayload.id
          ? day.exercises.find((e) => e.id === exPayload.id)
          : undefined;

        const exerciseId = existingExercise?.id ?? crypto.randomUUID();

        let sets: RoutineExerciseSet[];
        if (exPayload.sets != null && exPayload.sets.length > 0) {
          const existingSets = existingExercise?.sets ?? [];
          sets = exPayload.sets.map((s) => {
            const existing = existingSets.find(
              (es) => es.setNumber === s.setNumber,
            );
            if (existing) {
              return RoutineExerciseSet.reconstitute(
                existing.id,
                s.setNumber,
                s.reps,
                s.weight,
                s.restSeconds ?? null,
              );
            }
            return RoutineExerciseSet.create(
              s.setNumber,
              s.reps,
              s.weight,
              s.restSeconds,
            );
          });
        } else {
          sets = existingExercise?.sets ?? [];
        }

        return Exercise.reconstitute(
          exerciseId,
          exPayload.name,
          exPayload.order,
          sets,
        );
      });

      return RoutineDay.reconstitute(day.dayOfWeek, exercises, day.id);
    });

    // Validate that all payload days exist in the routine
    for (const dayPayload of input.days) {
      const exists = routine.days.some(
        (d) => d.dayOfWeek === dayPayload.dayOfWeek,
      );
      if (!exists) {
        throw new RoutineDomainError(
          RoutineErrorCode.EXERCISE_DAY_NOT_FOUND,
          `Day "${dayPayload.dayOfWeek}" not found in routine`,
          { dayOfWeek: dayPayload.dayOfWeek },
        );
      }
    }

    const updatedRoutine = Routine.reconstitute(
      routine.id,
      routine.name,
      routine.userId,
      updatedDays,
      routine.isActive,
      routine.trainingStrategyKey,
      routine.createdAt,
      new Date(),
    );

    const saved = await this.routineRepository.save(updatedRoutine);

    return this.mapToOutput(saved);
  }

  private mapToOutput(routine: Routine): SyncRoutineOutput {
    return {
      id: routine.id,
      name: routine.name,
      userId: routine.userId,
      isActive: routine.isActive,
      days: routine.days.map((d) => ({
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
      createdAt: routine.createdAt,
      updatedAt: routine.updatedAt,
    };
  }
}

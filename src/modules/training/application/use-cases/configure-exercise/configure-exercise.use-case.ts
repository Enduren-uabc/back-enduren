import { Routine } from '../../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ConfigureExerciseInput {
  routineId: string;
  dayOfWeek: string;
  exerciseId: string;
  sets: number;
  repsPerSet: number;
  weight: number;
}

export interface ConfigureExerciseOutput {
  id: string;
  name: string;
  userId: string;
  days: Array<{
    dayOfWeek: string;
    exercises: Array<{
      id: string;
      name: string;
      order: number;
      sets: number | null;
      repsPerSet: number | null;
      weight: number | null;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class ConfigureExerciseUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    _actor: CurrentActor,
    input: ConfigureExerciseInput,
  ): Promise<ConfigureExerciseOutput> {
    // Validate routine exists (RF-11.0.5)
    const routine = await this.routineRepository.findById(input.routineId);
    if (!routine) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    // Delegate configuration to domain — enforces day exists, exercise exists, and configuration invariants
    const updatedRoutine = routine.configureExercise(
      input.dayOfWeek,
      input.exerciseId,
      input.sets,
      input.repsPerSet,
      input.weight,
    );

    const saved = await this.routineRepository.save(updatedRoutine);

    return this.mapToOutput(saved);
  }

  private mapToOutput(routine: Routine): ConfigureExerciseOutput {
    return {
      id: routine.id,
      name: routine.name,
      userId: routine.userId,
      days: routine.days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        exercises: d.exercises.map((e) => ({
          id: e.id,
          name: e.name,
          order: e.order,
          sets: e.configuration?.sets ?? null,
          repsPerSet: e.configuration?.repsPerSet ?? null,
          weight: e.configuration?.weight ?? null,
        })),
      })),
      createdAt: routine.createdAt,
      updatedAt: routine.updatedAt,
    };
  }
}

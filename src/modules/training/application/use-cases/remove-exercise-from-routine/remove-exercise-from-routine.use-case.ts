import { Routine } from '../../../domain/entities/routine.entity';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface RemoveExerciseFromRoutineInput {
  routineId: string;
  dayOfWeek: string;
  exerciseId: string;
}

export interface RemoveExerciseFromRoutineOutput {
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

export class RemoveExerciseFromRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    _actor: CurrentActor,
    input: RemoveExerciseFromRoutineInput,
  ): Promise<RemoveExerciseFromRoutineOutput> {
    // Validate routine exists
    const routine = await this.routineRepository.findById(input.routineId);
    if (!routine) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    // Delegate to aggregate root — enforces day exists and exercise exists in day
    const updatedRoutine = routine.removeExerciseFromDay(
      input.dayOfWeek,
      input.exerciseId,
    );

    const saved = await this.routineRepository.save(updatedRoutine);

    return this.mapToOutput(saved);
  }

  private mapToOutput(routine: Routine): RemoveExerciseFromRoutineOutput {
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

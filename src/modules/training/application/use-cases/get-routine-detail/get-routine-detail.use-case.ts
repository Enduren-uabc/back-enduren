import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import { CurrentActor } from '../../ports/current-actor.port';

export interface GetRoutineDetailOutput {
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
      sets: number | null;
      repsPerSet: number | null;
      weight: number | null;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class GetRoutineDetailUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(
    actor: CurrentActor,
    input: { routineId: string },
  ): Promise<GetRoutineDetailOutput> {
    const routine = await this.routineRepository.findByIdAndUserId(
      input.routineId,
      actor.userId,
    );

    if (routine === null) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

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

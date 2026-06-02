import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import type { RoutineTargetAudience } from '../../../domain/value-objects/routine-target-audience.value-object';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ListRoutinesOutput {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  trainingStrategyKey: string | null;
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

export class ListRoutinesUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(actor: CurrentActor): Promise<ListRoutinesOutput[]> {
    const routines = await this.routineRepository.findByUserId(actor.userId);

    return routines.map((routine) => this.mapToOutput(routine));
  }

  private mapToOutput(routine: Routine): ListRoutinesOutput {
    return {
      id: routine.id,
      name: routine.name,
      userId: routine.userId,
      isActive: routine.isActive,
      trainingStrategyKey: routine.trainingStrategyKey,
      targetAudience: routine.targetAudience,
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

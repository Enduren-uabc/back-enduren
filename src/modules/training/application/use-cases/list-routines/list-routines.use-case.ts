import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ListRoutinesOutput {
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

export class ListRoutinesUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  public async execute(actor: CurrentActor): Promise<ListRoutinesOutput[]> {
    const routines = await this.routineRepository.findByUserId(actor.userId);

    return routines.map((routine) => ({
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
    }));
  }
}

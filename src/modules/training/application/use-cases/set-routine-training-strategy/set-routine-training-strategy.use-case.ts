import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { TrainingStrategyRepository } from '../../../domain/repositories/training-strategy.repository';
import {
  RoutineDomainError,
  RoutineErrorCode,
} from '../../../domain/errors/routine-domain.error';
import {
  TrainingStrategyDomainError,
  TrainingStrategyErrorCode,
} from '../../../domain/errors/training-strategy-domain.error';
import { CurrentActor } from '../../ports/current-actor.port';

export const ROUTINE_REPOSITORY_PORT_FOR_STRATEGY = Symbol(
  'ROUTINE_REPOSITORY_PORT_FOR_STRATEGY',
);
export const TRAINING_STRATEGY_REPOSITORY_PORT_FOR_SET = Symbol(
  'TRAINING_STRATEGY_REPOSITORY_PORT_FOR_SET',
);

export interface SetRoutineTrainingStrategyInput {
  routineId: string;
  strategyKey: string | null;
}

export interface SetRoutineTrainingStrategyOutput {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  trainingStrategyKey: string | null;
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

export class SetRoutineTrainingStrategyUseCase {
  constructor(
    private readonly routineRepository: RoutineRepository,
    private readonly trainingStrategyRepository: TrainingStrategyRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: SetRoutineTrainingStrategyInput,
  ): Promise<SetRoutineTrainingStrategyOutput> {
    const routine = await this.routineRepository.findByIdAndUserId(
      input.routineId,
      actor.userId,
    );

    if (!routine) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_FOUND,
        `Routine with id "${input.routineId}" not found`,
        { routineId: input.routineId },
      );
    }

    if (routine.userId !== actor.userId) {
      throw new RoutineDomainError(
        RoutineErrorCode.ROUTINE_NOT_OWNED,
        'Routine does not belong to the current user',
        { routineId: input.routineId, userId: actor.userId },
      );
    }

    if (input.strategyKey !== null) {
      const strategy = await this.trainingStrategyRepository.findByKey(
        input.strategyKey,
      );
      if (!strategy) {
        throw new TrainingStrategyDomainError(
          TrainingStrategyErrorCode.STRATEGY_NOT_FOUND,
          `Training strategy with key "${input.strategyKey}" not found`,
          { strategyKey: input.strategyKey },
        );
      }
    }

    const updated = routine.setTrainingStrategy(input.strategyKey);
    const saved = await this.routineRepository.save(updated);

    return {
      id: saved.id,
      name: saved.name,
      userId: saved.userId,
      isActive: saved.isActive,
      trainingStrategyKey: saved.trainingStrategyKey,
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

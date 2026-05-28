import { Routine } from '../entities/routine.entity';
import type { RoutineTargetAudience } from '../value-objects/routine-target-audience.value-object';

export interface RoutineRepository {
  save(routine: Routine): Promise<Routine>;
  findById(id: string): Promise<Routine | null>;
  findByUserId(userId: string): Promise<Routine[]>;
  findByUserIdAndTargetAudience?(
    userId: string,
    targetAudience: RoutineTargetAudience,
  ): Promise<Routine[]>;
  existsByNameForUser(name: string, userId: string): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
  countByUserIdAndTargetAudience?(
    userId: string,
    targetAudience: RoutineTargetAudience,
  ): Promise<number>;
  findActiveByUserId(userId: string): Promise<Routine | null>;
  findByIdAndUserId(id: string, userId: string): Promise<Routine | null>;
  delete(routine: Routine): Promise<void>;
}

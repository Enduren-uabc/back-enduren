import { Routine } from '../entities/routine.entity';

export interface RoutineRepository {
  save(routine: Routine): Promise<Routine>;
  findById(id: string): Promise<Routine | null>;
  findByUserId(userId: string): Promise<Routine[]>;
  existsByNameForUser(name: string, userId: string): Promise<boolean>;
  countByUserId(userId: string): Promise<number>;
}

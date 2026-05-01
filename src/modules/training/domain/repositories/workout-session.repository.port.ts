import { WorkoutSession } from '../entities/workout-session.entity';

/**
 * WorkoutSession repository port (interface in domain).
 * Defines the contract for WorkoutSession persistence.
 */
export interface WorkoutSessionRepository {
  save(session: WorkoutSession): Promise<WorkoutSession>;
  findById(id: string): Promise<WorkoutSession | null>;
  findInProgressByUserId(userId: string): Promise<WorkoutSession | null>;
  findFinishedByUserId(userId: string): Promise<WorkoutSession[]>;
}

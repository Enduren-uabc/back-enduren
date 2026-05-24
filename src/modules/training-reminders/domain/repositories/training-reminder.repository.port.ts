import { TrainingReminder } from '../entities/training-reminder.entity';

export const TRAINING_REMINDER_REPOSITORY_PORT = Symbol('TRAINING_REMINDER_REPOSITORY_PORT');

export interface TrainingReminderRepository {
  save(reminder: TrainingReminder): Promise<TrainingReminder>;
  findById(id: string): Promise<TrainingReminder | null>;
  findByUserId(userId: string): Promise<TrainingReminder[]>;
  findDue(now: Date): Promise<TrainingReminder[]>;
  delete(id: string): Promise<void>;
}

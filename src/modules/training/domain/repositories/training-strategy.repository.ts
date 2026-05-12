import { TrainingStrategy } from '../entities/training-strategy.entity';

export interface TrainingStrategyRepository {
  findAll(): Promise<TrainingStrategy[]>;
  findByKey(key: string): Promise<TrainingStrategy | null>;
}

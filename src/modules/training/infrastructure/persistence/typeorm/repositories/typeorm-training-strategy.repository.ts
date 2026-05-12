import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingStrategyRepository } from '../../../../domain/repositories/training-strategy.repository';
import { TrainingStrategy } from '../../../../domain/entities/training-strategy.entity';
import { TrainingStrategyTypeormEntity } from '../entities/training-strategy-typeorm.entity';

@Injectable()
export class TypeormTrainingStrategyRepository implements TrainingStrategyRepository {
  constructor(
    @InjectRepository(TrainingStrategyTypeormEntity)
    private readonly ormRepo: Repository<TrainingStrategyTypeormEntity>,
  ) {}

  public async findAll(): Promise<TrainingStrategy[]> {
    const ormEntities = await this.ormRepo.find();
    return ormEntities.map((e) =>
      TrainingStrategy.reconstitute(
        e.key,
        e.name,
        e.description,
        e.rules as {
          type: 'linear' | 'percentage' | 'wave';
          weightStep?: number;
          repStep?: number;
          weightPercentage?: number;
          wavePercentages?: number[];
        },
      ),
    );
  }

  public async findByKey(key: string): Promise<TrainingStrategy | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { key } });
    if (!ormEntity) {
      return null;
    }
    return TrainingStrategy.reconstitute(
      ormEntity.key,
      ormEntity.name,
      ormEntity.description,
      ormEntity.rules as {
        type: 'linear' | 'percentage' | 'wave';
        weightStep?: number;
        repStep?: number;
        weightPercentage?: number;
        wavePercentages?: number[];
      },
    );
  }
}

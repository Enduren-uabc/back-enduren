import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { TrainingReminder } from '../../../../domain/entities/training-reminder.entity';
import { TrainingReminderRepository } from '../../../../domain/repositories/training-reminder.repository.port';
import { TrainingReminderTypeormEntity } from '../entities/training-reminder-typeorm.entity';
import { TrainingReminderMapper } from '../../../mappers/training-reminder.mapper';

@Injectable()
export class TypeormTrainingReminderRepository implements TrainingReminderRepository {
  constructor(
    @InjectRepository(TrainingReminderTypeormEntity)
    private readonly ormRepo: Repository<TrainingReminderTypeormEntity>,
  ) {}

  public async save(reminder: TrainingReminder): Promise<TrainingReminder> {
    const orm = TrainingReminderMapper.toOrm(reminder);
    const saved = await this.ormRepo.save(orm);
    return TrainingReminderMapper.toDomain(saved);
  }

  public async findById(id: string): Promise<TrainingReminder | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    return orm ? TrainingReminderMapper.toDomain(orm) : null;
  }

  public async findByUserId(userId: string): Promise<TrainingReminder[]> {
    const orms = await this.ormRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return orms.map(TrainingReminderMapper.toDomain);
  }

  public async findDue(now: Date): Promise<TrainingReminder[]> {
    const orms = await this.ormRepo.find({
      where: {
        status: 'activo',
        nextActivationAt: LessThanOrEqual(now),
        deletedAt: IsNull(),
      },
      order: { nextActivationAt: 'ASC' },
    });
    return orms.map(TrainingReminderMapper.toDomain);
  }

  public async delete(id: string): Promise<void> {
    await this.ormRepo.softDelete(id);
  }
}

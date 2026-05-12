import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutineRepository } from '../../../../domain/repositories/routine.repository';
import { Routine } from '../../../../domain/entities/routine.entity';
import { RoutineTypeormEntity } from '../entities/routine-typeorm.entity';
import { RoutineMapper } from '../../../mappers/routine.mapper';

@Injectable()
export class TypeormRoutineRepository implements RoutineRepository {
  constructor(
    @InjectRepository(RoutineTypeormEntity)
    private readonly ormRepo: Repository<RoutineTypeormEntity>,
  ) {}

  public async save(routine: Routine): Promise<Routine> {
    const ormEntity = RoutineMapper.toOrm(routine);
    const saved = await this.ormRepo.save(ormEntity);
    return RoutineMapper.toDomain(saved);
  }

  public async findById(id: string): Promise<Routine | null> {
    const ormEntity = await this.ormRepo.findOne({
      where: { id },
      relations: ['days', 'days.exercises', 'days.exercises.sets'],
    });
    if (!ormEntity) {
      return null;
    }
    return RoutineMapper.toDomain(ormEntity);
  }

  public async findByUserId(userId: string): Promise<Routine[]> {
    const ormEntities = await this.ormRepo.find({
      where: { userId },
      relations: ['days', 'days.exercises', 'days.exercises.sets'],
    });
    return ormEntities.map((e) => RoutineMapper.toDomain(e));
  }

  public async existsByNameForUser(
    name: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.ormRepo.count({
      where: { name, userId },
    });
    return count > 0;
  }

  public async countByUserId(userId: string): Promise<number> {
    return this.ormRepo.count({ where: { userId } });
  }

  public async findActiveByUserId(userId: string): Promise<Routine | null> {
    const ormEntity = await this.ormRepo.findOne({
      where: { userId, isActive: true },
      relations: ['days', 'days.exercises', 'days.exercises.sets'],
    });
    if (!ormEntity) {
      return null;
    }
    return RoutineMapper.toDomain(ormEntity);
  }

  public async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<Routine | null> {
    const ormEntity = await this.ormRepo.findOne({
      where: { id, userId },
      relations: ['days', 'days.exercises', 'days.exercises.sets'],
    });
    if (!ormEntity) {
      return null;
    }
    return RoutineMapper.toDomain(ormEntity);
  }

  public async delete(routine: Routine): Promise<void> {
    const ormEntity = RoutineMapper.toOrm(routine);
    await this.ormRepo.remove(ormEntity);
  }
}

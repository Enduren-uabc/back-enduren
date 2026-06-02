import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainerAssignedRoutine } from '../../../../domain/entities/trainer-assigned-routine.entity';
import {
  TrainerAssignedRoutineRepositoryPort,
  PaginatedResult,
  Pagination,
} from '../../../../domain/repositories/trainer-assigned-routine.repository.port';
import { TrainerAssignedRoutineTypeormEntity } from '../entities/trainer-assigned-routine-typeorm.entity';
import { TrainerAssignedRoutineMapper } from '../../../mappers/trainer-assigned-routine.mapper';

@Injectable()
export class TypeormTrainerAssignedRoutineRepository implements TrainerAssignedRoutineRepositoryPort {
  constructor(
    @InjectRepository(TrainerAssignedRoutineTypeormEntity)
    private readonly repo: Repository<TrainerAssignedRoutineTypeormEntity>,
  ) {}

  async save(
    assigned: TrainerAssignedRoutine,
  ): Promise<TrainerAssignedRoutine> {
    const orm = TrainerAssignedRoutineMapper.toOrm(assigned);
    const saved = await this.repo.save(orm);
    return TrainerAssignedRoutineMapper.toDomain(saved);
  }

  async findById(id: string): Promise<TrainerAssignedRoutine | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? TrainerAssignedRoutineMapper.toDomain(orm) : null;
  }

  async findActiveByClientId(
    clientId: string,
  ): Promise<TrainerAssignedRoutine | null> {
    const orm = await this.repo.findOne({
      where: { clientId, status: 'active' },
      order: { assignedAt: 'DESC' },
    });
    return orm ? TrainerAssignedRoutineMapper.toDomain(orm) : null;
  }

  async findByTrainerAndClient(
    trainerId: string,
    clientId: string,
    pagination?: Pagination,
  ): Promise<PaginatedResult<TrainerAssignedRoutine>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [items, total] = await this.repo.findAndCount({
      where: { trainerId, clientId },
      order: { assignedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      items: items.map((orm) => TrainerAssignedRoutineMapper.toDomain(orm)),
      total,
      page,
      limit,
    };
  }

  async findByIdAndTrainer(
    assignedId: string,
    trainerId: string,
  ): Promise<TrainerAssignedRoutine | null> {
    const orm = await this.repo.findOne({
      where: { id: assignedId, trainerId },
    });
    return orm ? TrainerAssignedRoutineMapper.toDomain(orm) : null;
  }

  async findActiveByClientAndTrainer(
    clientId: string,
    trainerId: string,
  ): Promise<TrainerAssignedRoutine | null> {
    const orm = await this.repo.findOne({
      where: { clientId, trainerId, status: 'active' },
      order: { assignedAt: 'DESC' },
    });
    return orm ? TrainerAssignedRoutineMapper.toDomain(orm) : null;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainerLink } from '../../../../domain/entities/trainer-link.entity';
import { TrainerLinkRepositoryPort } from '../../../../domain/repositories/trainer-link.repository.port';
import {
  Pagination,
  PaginatedResult,
} from '../../../../domain/repositories/trainer-link-request.repository.port';
import { TrainerLinkTypeormEntity } from '../entities/trainer-link-typeorm.entity';
import { TrainerLinkMapper } from '../../../mappers/trainer-link.mapper';

@Injectable()
export class TypeormTrainerLinkRepository implements TrainerLinkRepositoryPort {
  constructor(
    @InjectRepository(TrainerLinkTypeormEntity)
    private readonly ormRepo: Repository<TrainerLinkTypeormEntity>,
  ) {}

  async save(link: TrainerLink): Promise<TrainerLink> {
    const ormEntity = TrainerLinkMapper.toOrm(link);
    const saved = await this.ormRepo.save(ormEntity);
    return TrainerLinkMapper.toDomain(saved);
  }

  async findById(id: string): Promise<TrainerLink | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    return entity ? TrainerLinkMapper.toDomain(entity) : null;
  }

  async findByClientAndTrainer(
    clientId: string,
    trainerId: string,
  ): Promise<TrainerLink | null> {
    const entity = await this.ormRepo.findOne({
      where: { clientId, trainerId, status: 'active' },
    });
    return entity ? TrainerLinkMapper.toDomain(entity) : null;
  }

  async findActiveByTrainerId(
    trainerId: string,
    pagination: Pagination,
  ): Promise<PaginatedResult<TrainerLink>> {
    const skip = (pagination.page - 1) * pagination.limit;
    const [items, total] = await this.ormRepo.findAndCount({
      where: { trainerId, status: 'active' },
      order: { activatedAt: 'DESC' },
      skip,
      take: pagination.limit,
    });

    return {
      items: items.map((e) => TrainerLinkMapper.toDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async findActiveByTrainerIdAndClientId(
    trainerId: string,
    clientId: string,
  ): Promise<TrainerLink | null> {
    const entity = await this.ormRepo.findOne({
      where: { trainerId, clientId, status: 'active' },
    });
    return entity ? TrainerLinkMapper.toDomain(entity) : null;
  }

  async findActiveByClientId(clientId: string): Promise<TrainerLink[]> {
    const entities = await this.ormRepo.find({
      where: { clientId, status: 'active' },
    });
    return entities.map((e) => TrainerLinkMapper.toDomain(e));
  }

  async countActiveByClientId(clientId: string): Promise<number> {
    return this.ormRepo.count({
      where: { clientId, status: 'active' },
    });
  }

  async countActiveByTrainerId(trainerId: string): Promise<number> {
    return this.ormRepo.count({
      where: { trainerId, status: 'active' },
    });
  }
}

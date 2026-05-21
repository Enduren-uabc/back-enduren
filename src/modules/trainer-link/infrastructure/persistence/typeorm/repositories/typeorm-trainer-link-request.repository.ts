import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainerLinkRequest } from '../../../../domain/entities/trainer-link-request.entity';
import {
  TrainerLinkRequestRepositoryPort,
  Pagination,
  PaginatedResult,
} from '../../../../domain/repositories/trainer-link-request.repository.port';
import { LinkRequestStatus } from '../../../../domain/value-objects/link-status.vo';
import { TrainerLinkRequestTypeormEntity } from '../entities/trainer-link-request-typeorm.entity';
import { TrainerLinkRequestMapper } from '../../../mappers/trainer-link-request.mapper';

@Injectable()
export class TypeormTrainerLinkRequestRepository implements TrainerLinkRequestRepositoryPort {
  constructor(
    @InjectRepository(TrainerLinkRequestTypeormEntity)
    private readonly ormRepo: Repository<TrainerLinkRequestTypeormEntity>,
  ) {}

  async save(request: TrainerLinkRequest): Promise<TrainerLinkRequest> {
    const ormEntity = TrainerLinkRequestMapper.toOrm(request);
    const saved = await this.ormRepo.save(ormEntity);
    return TrainerLinkRequestMapper.toDomain(saved);
  }

  async findById(id: string): Promise<TrainerLinkRequest | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });
    return entity ? TrainerLinkRequestMapper.toDomain(entity) : null;
  }

  async findPendingByClientAndTrainer(
    clientId: string,
    trainerId: string,
  ): Promise<TrainerLinkRequest | null> {
    const entity = await this.ormRepo.findOne({
      where: { clientId, trainerId, status: 'pendiente' },
    });
    return entity ? TrainerLinkRequestMapper.toDomain(entity) : null;
  }

  async findSentByClientId(
    clientId: string,
    filters: { status?: LinkRequestStatus },
    pagination: Pagination,
  ): Promise<PaginatedResult<TrainerLinkRequest>> {
    const query = this.ormRepo
      .createQueryBuilder('r')
      .where('r.clientId = :clientId', { clientId })
      .orderBy('r.createdAt', 'DESC');

    if (filters.status) {
      query.andWhere('r.status = :status', { status: filters.status });
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [items, total] = await query
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      items: items.map((e) => TrainerLinkRequestMapper.toDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async findReceivedByTrainerId(
    trainerId: string,
    filters: { status?: LinkRequestStatus },
    pagination: Pagination,
  ): Promise<PaginatedResult<TrainerLinkRequest>> {
    const query = this.ormRepo
      .createQueryBuilder('r')
      .where('r.trainerId = :trainerId', { trainerId })
      .orderBy('r.createdAt', 'DESC');

    if (filters.status) {
      query.andWhere('r.status = :status', { status: filters.status });
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [items, total] = await query
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      items: items.map((e) => TrainerLinkRequestMapper.toDomain(e)),
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async hasPendingRequest(
    clientId: string,
    trainerId: string,
  ): Promise<boolean> {
    const count = await this.ormRepo.count({
      where: { clientId, trainerId, status: 'pendiente' },
    });
    return count > 0;
  }
}

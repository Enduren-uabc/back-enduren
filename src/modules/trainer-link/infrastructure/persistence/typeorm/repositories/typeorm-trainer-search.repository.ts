import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TrainerSearchRepositoryPort,
  TrainerSearchResult,
} from '../../../../domain/repositories/trainer-search.repository.port';
import {
  Pagination,
  PaginatedResult,
} from '../../../../domain/repositories/trainer-link-request.repository.port';
import { UserTypeormEntity } from '../../../../../users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';

@Injectable()
export class TypeormTrainerSearchRepository implements TrainerSearchRepositoryPort {
  constructor(
    @InjectRepository(UserTypeormEntity)
    private readonly userRepo: Repository<UserTypeormEntity>,
  ) {}

  async searchVerifiedTrainers(
    query: string,
    pagination: Pagination,
  ): Promise<PaginatedResult<TrainerSearchResult>> {
    const isCodeQuery = /^END-[A-HJKMNP-Z2-9]{6}$/i.test(query.trim());

    let qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.role = :role', { role: 'trainer' })
      .andWhere('u.trainerCode IS NOT NULL');

    if (isCodeQuery) {
      qb = qb.andWhere('u.trainerCode = :code', {
        code: query.trim().toUpperCase(),
      });
    } else {
      qb = qb.andWhere('(u.username ILIKE :search OR u.email ILIKE :search)', {
        search: `%${query.trim()}%`,
      });
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const [users, total] = await qb
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    const results: TrainerSearchResult[] = users.map((user) => ({
      userId: user.id,
      trainerCode: user.trainerCode!,
      displayName: user.username,
      specialties: [],
      yearsOfExperience: 0,
      shortBio: null,
      profileImageUrl: null,
    }));

    return {
      items: results,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  async findByTrainerCode(code: string): Promise<{
    userId: string;
    trainerCode: string;
    displayName: string;
    role: string;
  } | null> {
    if (!code) return null;
    const user = await this.userRepo.findOne({
      where: { trainerCode: code },
    });
    if (!user || !user.trainerCode) return null;
    return {
      userId: user.id,
      trainerCode: user.trainerCode,
      displayName: user.username,
      role: user.role,
    };
  }
}

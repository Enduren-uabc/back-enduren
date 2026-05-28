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
      .leftJoin('trainer_verifications', 'tv', 'tv.user_id = u.id')
      .leftJoin('social_profiles', 'sp', 'sp.user_id = u.id')
      .select([
        'u.id',
        'u.trainerCode',
        'u.username',
        'u.avatarUrl',
        'tv.years_of_experience',
        'tv.short_bio',
        'sp.display_name',
        'sp.avatar_url',
      ])
      .skip(skip)
      .take(pagination.limit)
      .getManyAndCount();

    const results: TrainerSearchResult[] = users.map((user: any) => ({
      userId: user.id,
      trainerCode: user.trainer_code ?? user.trainerCode,
      displayName: user.display_name ?? user.username,
      specialties: [],
      yearsOfExperience: user.years_of_experience ?? 0,
      shortBio: user.short_bio ?? null,
      profileImageUrl: user.avatar_url ?? user.avatarUrl ?? null,
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

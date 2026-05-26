import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { SocialProfile } from '../../../../domain/entities/social-profile.entity';
import { SocialProfileRepository } from '../../../../domain/repositories/social-profile.repository';
import { SocialProfilePersistenceMapper } from '../../../mappers/social-profile.mapper';
import { SocialProfileTypeormEntity } from '../entities/social-profile-typeorm.entity';

@Injectable()
export class TypeormSocialProfileRepository implements SocialProfileRepository {
  constructor(
    @InjectRepository(SocialProfileTypeormEntity)
    private readonly ormRepo: Repository<SocialProfileTypeormEntity>,
  ) {}

  public async save(profile: SocialProfile): Promise<SocialProfile> {
    const saved = await this.ormRepo.save(
      SocialProfilePersistenceMapper.toOrm(profile),
    );
    return SocialProfilePersistenceMapper.toDomain(saved);
  }

  public async findByUserId(userId: string): Promise<SocialProfile | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { userId } });
    return ormEntity
      ? SocialProfilePersistenceMapper.toDomain(ormEntity)
      : null;
  }

  public async findByHandle(handle: string): Promise<SocialProfile | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { handle } });
    return ormEntity
      ? SocialProfilePersistenceMapper.toDomain(ormEntity)
      : null;
  }

  public async findByUserIds(userIds: string[]): Promise<SocialProfile[]> {
    if (userIds.length === 0) {
      return [];
    }

    const ormEntities = await this.ormRepo.find({
      where: { userId: In(userIds) },
    });

    const order = new Map(userIds.map((userId, index) => [userId, index]));
    return ormEntities
      .sort(
        (left, right) =>
          (order.get(left.userId) ?? 0) - (order.get(right.userId) ?? 0),
      )
      .map((ormEntity) => SocialProfilePersistenceMapper.toDomain(ormEntity));
  }

  public async searchByQuery(query: string): Promise<SocialProfile[]> {
    const pattern = `%${query}%`;
    const ormEntities = await this.ormRepo.find({
      where: [{ displayName: ILike(pattern) }, { handle: ILike(pattern) }],
      order: { displayName: 'ASC' },
      take: 20,
    });

    return ormEntities.map((ormEntity) =>
      SocialProfilePersistenceMapper.toDomain(ormEntity),
    );
  }
}

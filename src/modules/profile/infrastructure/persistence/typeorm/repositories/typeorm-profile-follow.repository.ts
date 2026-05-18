import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileFollow } from '../../../../domain/entities/profile-follow.entity';
import { ProfileFollowRepository } from '../../../../domain/repositories/profile-follow.repository';
import { ProfileFollowPersistenceMapper } from '../../../mappers/profile-follow.mapper';
import { ProfileFollowTypeormEntity } from '../entities/profile-follow-typeorm.entity';

@Injectable()
export class TypeormProfileFollowRepository implements ProfileFollowRepository {
  constructor(
    @InjectRepository(ProfileFollowTypeormEntity)
    private readonly ormRepo: Repository<ProfileFollowTypeormEntity>,
  ) {}

  public async save(follow: ProfileFollow): Promise<ProfileFollow> {
    const saved = await this.ormRepo.save(
      ProfileFollowPersistenceMapper.toOrm(follow),
    );
    return ProfileFollowPersistenceMapper.toDomain(saved);
  }

  public async findByFollowerAndFollowed(
    followerUserId: string,
    followedUserId: string,
  ): Promise<ProfileFollow | null> {
    const ormEntity = await this.ormRepo.findOne({
      where: { followerUserId, followedUserId },
    });
    return ormEntity
      ? ProfileFollowPersistenceMapper.toDomain(ormEntity)
      : null;
  }

  public async delete(follow: ProfileFollow): Promise<void> {
    await this.ormRepo.delete({ id: follow.id });
  }

  public async findFollowersOf(userId: string): Promise<ProfileFollow[]> {
    const ormEntities = await this.ormRepo.find({
      where: { followedUserId: userId },
      order: { createdAt: 'DESC' },
    });

    return ormEntities.map((ormEntity) =>
      ProfileFollowPersistenceMapper.toDomain(ormEntity),
    );
  }

  public async findFollowingOf(userId: string): Promise<ProfileFollow[]> {
    const ormEntities = await this.ormRepo.find({
      where: { followerUserId: userId },
      order: { createdAt: 'DESC' },
    });

    return ormEntities.map((ormEntity) =>
      ProfileFollowPersistenceMapper.toDomain(ormEntity),
    );
  }

  public async countFollowersOf(userId: string): Promise<number> {
    return this.ormRepo.count({ where: { followedUserId: userId } });
  }

  public async countFollowingOf(userId: string): Promise<number> {
    return this.ormRepo.count({ where: { followerUserId: userId } });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AuthorProfile,
  AuthorProfileQueryPort,
} from '../../application/ports/author-profile-query.port';
import { SocialProfileTypeormEntity } from '../../../profile/infrastructure/persistence/typeorm/entities/social-profile-typeorm.entity';
import { UserTypeormEntity } from '../../../users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';

@Injectable()
export class TypeormAuthorProfileQueryAdapter implements AuthorProfileQueryPort {
  constructor(
    @InjectRepository(SocialProfileTypeormEntity)
    private readonly socialProfileRepo: Repository<SocialProfileTypeormEntity>,
    @InjectRepository(UserTypeormEntity)
    private readonly userRepo: Repository<UserTypeormEntity>,
  ) {}

  public async findProfilesByUserIds(
    userIds: string[],
  ): Promise<AuthorProfile[]> {
    if (userIds.length === 0) return [];

    const profiles = await this.socialProfileRepo.find({
      where: { userId: In(userIds) },
      select: { userId: true, displayName: true, avatarUrl: true },
    });

    return profiles.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      avatarUrl: p.avatarUrl,
    }));
  }

  public async ensureProfilesExist(
    userIds: string[],
  ): Promise<AuthorProfile[]> {
    if (userIds.length === 0) return [];

    const existing = await this.socialProfileRepo.find({
      where: { userId: In(userIds) },
      select: { userId: true, displayName: true, avatarUrl: true },
    });

    const existingIds = new Set(existing.map((p) => p.userId));
    const missingIds = userIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      const users = await this.userRepo.find({
        where: { id: In(missingIds) },
        select: { id: true, username: true },
      });

      const newProfiles = users.map((user) => {
        const entity = new SocialProfileTypeormEntity();
        entity.userId = user.id;
        entity.displayName = user.username;
        entity.handle = `@user_${user.id.slice(0, 8)}`;
        entity.bio = null;
        entity.avatarUrl = null;
        return entity;
      });

      if (newProfiles.length > 0) {
        await this.socialProfileRepo.save(newProfiles);
      }
    }

    return this.findProfilesByUserIds(userIds);
  }
}

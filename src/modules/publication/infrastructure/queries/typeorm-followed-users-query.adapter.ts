import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowedUsersQueryPort } from '../../application/ports/followed-users-query.port';
import { ProfileFollowTypeormEntity } from '../../../profile/infrastructure/persistence/typeorm/entities/profile-follow-typeorm.entity';

@Injectable()
export class TypeormFollowedUsersQueryAdapter implements FollowedUsersQueryPort {
  constructor(
    @InjectRepository(ProfileFollowTypeormEntity)
    private readonly followRepo: Repository<ProfileFollowTypeormEntity>,
  ) {}

  public async findFollowedUserIds(userId: string): Promise<string[]> {
    const follows = await this.followRepo.find({
      where: { followerUserId: userId },
      select: { followedUserId: true },
    });

    return follows.map((follow) => follow.followedUserId);
  }
}

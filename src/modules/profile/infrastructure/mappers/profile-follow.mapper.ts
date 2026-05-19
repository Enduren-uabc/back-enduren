import { ProfileFollow } from '../../domain/entities/profile-follow.entity';
import { ProfileFollowTypeormEntity } from '../persistence/typeorm/entities/profile-follow-typeorm.entity';

export class ProfileFollowPersistenceMapper {
  public static toDomain(ormEntity: ProfileFollowTypeormEntity): ProfileFollow {
    return ProfileFollow.reconstitute(
      ormEntity.id,
      ormEntity.followerUserId,
      ormEntity.followedUserId,
      ormEntity.createdAt,
    );
  }

  public static toOrm(follow: ProfileFollow): ProfileFollowTypeormEntity {
    const ormEntity = new ProfileFollowTypeormEntity();
    ormEntity.id = follow.id;
    ormEntity.followerUserId = follow.followerUserId;
    ormEntity.followedUserId = follow.followedUserId;
    ormEntity.createdAt = follow.createdAt;
    return ormEntity;
  }
}

import { SocialProfile } from '../../domain/entities/social-profile.entity';
import { ProfileAvatarUrl } from '../../domain/value-objects/profile-avatar-url.value-object';
import { SocialProfileTypeormEntity } from '../persistence/typeorm/entities/social-profile-typeorm.entity';

export class SocialProfilePersistenceMapper {
  public static toDomain(ormEntity: SocialProfileTypeormEntity): SocialProfile {
    return SocialProfile.reconstitute(
      ormEntity.userId,
      ormEntity.displayName,
      ormEntity.handle,
      ormEntity.bio,
      ProfileAvatarUrl.reconstitute(ormEntity.avatarUrl),
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  public static toOrm(profile: SocialProfile): SocialProfileTypeormEntity {
    const ormEntity = new SocialProfileTypeormEntity();
    ormEntity.userId = profile.userId;
    ormEntity.displayName = profile.displayName;
    ormEntity.handle = profile.handle;
    ormEntity.bio = profile.bio;
    ormEntity.avatarUrl = profile.avatarUrl.value;
    ormEntity.createdAt = profile.createdAt;
    ormEntity.updatedAt = profile.updatedAt;
    return ormEntity;
  }
}

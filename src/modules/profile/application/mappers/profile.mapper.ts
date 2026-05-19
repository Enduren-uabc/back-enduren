import { SocialProfile } from '../../domain/entities/social-profile.entity';
import { ProfileDto } from '../dto/profile.dto';

export class ProfileApplicationMapper {
  public static toDto(profile: SocialProfile): ProfileDto {
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      handle: profile.handle,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl.value,
    };
  }
}

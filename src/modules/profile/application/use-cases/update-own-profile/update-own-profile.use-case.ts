import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { ProfileAvatarUrl } from '../../../domain/value-objects/profile-avatar-url.value-object';
import { ProfileDto } from '../../dto/profile.dto';
import { UpdateOwnProfileDto } from '../../dto/update-own-profile.dto';
import { ProfileApplicationMapper } from '../../mappers/profile.mapper';
import { CurrentActor } from '../../ports/current-actor.port';

export class UpdateOwnProfileUseCase {
  constructor(private readonly profileRepository: SocialProfileRepository) {}

  public async execute(
    actor: CurrentActor,
    input: UpdateOwnProfileDto,
  ): Promise<ProfileDto> {
    const profile = await this.profileRepository.findByUserId(actor.userId);

    if (profile === null) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_NOT_FOUND,
        `Profile with user id "${actor.userId}" not found`,
        { userId: actor.userId },
      );
    }

    if (input.handle !== undefined && input.handle !== null) {
      const existing = await this.profileRepository.findByHandle(input.handle);
      if (existing && existing.userId !== actor.userId) {
        throw new ProfileDomainError(
          ProfileErrorCode.PROFILE_HANDLE_ALREADY_EXISTS,
          `Handle "${input.handle}" is already taken`,
          { handle: input.handle },
        );
      }
    }

    const updated = profile.updateOwn({
      displayName: input.displayName,
      bio: input.bio,
      avatarUrl:
        input.avatarUrl !== undefined
          ? ProfileAvatarUrl.create(input.avatarUrl)
          : undefined,
      handle: input.handle,
    });

    const saved = await this.profileRepository.save(updated);
    return ProfileApplicationMapper.toDto(saved);
  }
}

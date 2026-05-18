import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { ProfileFollowRepository } from '../../../domain/repositories/profile-follow.repository';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { ProfileDto } from '../../dto/profile.dto';
import { ProfileApplicationMapper } from '../../mappers/profile.mapper';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ListProfileFollowingInput {
  userId: string;
}

export class ListProfileFollowingUseCase {
  constructor(
    private readonly profileRepository: SocialProfileRepository,
    private readonly followRepository: ProfileFollowRepository,
  ) {}

  public async execute(
    _actor: CurrentActor,
    input: ListProfileFollowingInput,
  ): Promise<ProfileDto[]> {
    await this.ensureProfileExists(input.userId);

    const follows = await this.followRepository.findFollowingOf(input.userId);
    const profiles = await this.profileRepository.findByUserIds(
      follows.map((follow) => follow.followedUserId),
    );

    return profiles.map((profile) => ProfileApplicationMapper.toDto(profile));
  }

  private async ensureProfileExists(userId: string): Promise<void> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (profile === null) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_NOT_FOUND,
        `Profile with user id "${userId}" not found`,
        { userId },
      );
    }
  }
}

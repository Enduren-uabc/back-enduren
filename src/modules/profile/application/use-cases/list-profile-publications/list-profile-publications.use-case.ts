import { Inject } from '@nestjs/common';
import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import {
  ProfilePublicationPage,
  ProfilePublicationQueryPort,
} from '../../ports/profile-publication-query.port';
import { CurrentActor } from '../../ports/current-actor.port';
import {
  USER_REPOSITORY_PORT,
  UserRepository,
} from '../../../../users/domain/repositories/user.repository';

export const DEFAULT_PROFILE_PUBLICATIONS_LIMIT = 20;
export const MAX_PROFILE_PUBLICATIONS_LIMIT = 50;

export interface ListProfilePublicationsInput {
  userId: string;
  limit?: number;
  offset?: number;
}

export class ListProfilePublicationsUseCase {
  constructor(
    private readonly profileRepository: SocialProfileRepository,
    private readonly publicationQuery: ProfilePublicationQueryPort,
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepository,
  ) {}

  public async execute(
    _actor: CurrentActor,
    input: ListProfilePublicationsInput,
  ): Promise<ProfilePublicationPage> {
    let profile = await this.profileRepository.findByUserId(input.userId);

    if (profile === null) {
      const user = await this.userRepository.findById(input.userId);
      if (!user) {
        throw new Error(`User with id "${input.userId}" not found`);
      }
      profile = SocialProfile.create(
        user.id,
        user.username,
        `@user_${user.id.slice(0, 8)}`,
      );
      await this.profileRepository.save(profile);
    }

    const limit = input.limit ?? DEFAULT_PROFILE_PUBLICATIONS_LIMIT;
    const offset = input.offset ?? 0;

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_PROFILE_PUBLICATIONS_LIMIT ||
      !Number.isInteger(offset) ||
      offset < 0
    ) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_PUBLICATIONS_PAGINATION_INVALID,
        'Profile publications pagination is invalid',
        { limit, offset },
      );
    }

    return this.publicationQuery.findByAuthorUserId({
      authorUserId: input.userId,
      limit,
      offset,
    });
  }
}

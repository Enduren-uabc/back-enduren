import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { ProfileDto } from '../../dto/profile.dto';
import { ProfileApplicationMapper } from '../../mappers/profile.mapper';
import { CurrentActor } from '../../ports/current-actor.port';

export interface SearchProfilesInput {
  query: string;
}

export class SearchProfilesUseCase {
  constructor(private readonly profileRepository: SocialProfileRepository) {}

  public async execute(
    _actor: CurrentActor,
    input: SearchProfilesInput,
  ): Promise<ProfileDto[]> {
    const query = input.query?.trim() ?? '';

    if (query.length < 2 || query.length > 60) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_SEARCH_QUERY_INVALID,
        'Profile search query must contain between 2 and 60 characters',
        { query: input.query },
      );
    }

    const profiles = await this.profileRepository.searchByQuery(query);
    return profiles.map((profile) => ProfileApplicationMapper.toDto(profile));
  }
}

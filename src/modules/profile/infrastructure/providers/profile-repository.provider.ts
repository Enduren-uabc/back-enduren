import {
  PROFILE_CURRENT_ACTOR_PORT,
  PROFILE_FOLLOW_REPOSITORY_PORT,
  PROFILE_PUBLICATION_QUERY_PORT,
  SOCIAL_PROFILE_REPOSITORY_PORT,
} from '../../application/use-cases/follow-profile/follow-profile.use-case';
import { TypeormProfilePublicationQueryAdapter } from '../queries/typeorm-profile-publication-query.adapter';
import { TypeormProfileFollowRepository } from '../persistence/typeorm/repositories/typeorm-profile-follow.repository';
import { TypeormSocialProfileRepository } from '../persistence/typeorm/repositories/typeorm-social-profile.repository';
import { DevProfileActorService } from './current-actor.provider';

export const socialProfileRepositoryProvider = {
  provide: SOCIAL_PROFILE_REPOSITORY_PORT,
  useClass: TypeormSocialProfileRepository,
};

export const profileFollowRepositoryProvider = {
  provide: PROFILE_FOLLOW_REPOSITORY_PORT,
  useClass: TypeormProfileFollowRepository,
};

export const profileCurrentActorProvider = {
  provide: PROFILE_CURRENT_ACTOR_PORT,
  useClass: DevProfileActorService,
};

export const profilePublicationQueryProvider = {
  provide: PROFILE_PUBLICATION_QUERY_PORT,
  useClass: TypeormProfilePublicationQueryAdapter,
};

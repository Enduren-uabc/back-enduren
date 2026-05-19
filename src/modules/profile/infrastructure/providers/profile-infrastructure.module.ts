import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationTypeormEntity } from '../../../publication/infrastructure/persistence/typeorm/entities/publication-typeorm.entity';
import {
  PROFILE_CURRENT_ACTOR_PORT,
  PROFILE_FOLLOW_REPOSITORY_PORT,
  PROFILE_PUBLICATION_QUERY_PORT,
  SOCIAL_PROFILE_REPOSITORY_PORT,
} from '../../application/use-cases/follow-profile/follow-profile.use-case';
import { ProfileFollowTypeormEntity } from '../persistence/typeorm/entities/profile-follow-typeorm.entity';
import { SocialProfileTypeormEntity } from '../persistence/typeorm/entities/social-profile-typeorm.entity';
import {
  profileCurrentActorProvider,
  profileFollowRepositoryProvider,
  profilePublicationQueryProvider,
  socialProfileRepositoryProvider,
} from './profile-repository.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SocialProfileTypeormEntity,
      ProfileFollowTypeormEntity,
      PublicationTypeormEntity,
    ]),
  ],
  providers: [
    socialProfileRepositoryProvider,
    profileFollowRepositoryProvider,
    profileCurrentActorProvider,
    profilePublicationQueryProvider,
  ],
  exports: [
    SOCIAL_PROFILE_REPOSITORY_PORT,
    PROFILE_FOLLOW_REPOSITORY_PORT,
    PROFILE_CURRENT_ACTOR_PORT,
    PROFILE_PUBLICATION_QUERY_PORT,
  ],
})
export class ProfileInfrastructureModule {}

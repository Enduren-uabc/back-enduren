import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PUBLICATION_REACTION_REPOSITORY_PORT } from '../../application/use-cases/add-publication-reaction/add-publication-reaction.use-case';
import { PUBLICATION_COMMENT_REPOSITORY_PORT } from '../../application/use-cases/create-publication-comment/create-publication-comment.use-case';
import { PUBLICATION_FOLLOWED_USERS_QUERY_PORT } from '../../application/use-cases/list-publications/list-publications.use-case';
import { ProfileFollowTypeormEntity } from '../../../profile/infrastructure/persistence/typeorm/entities/profile-follow-typeorm.entity';
import { PublicationTypeormEntity } from '../persistence/typeorm/entities/publication-typeorm.entity';
import { PublicationCommentTypeormEntity } from '../persistence/typeorm/entities/publication-comment-typeorm.entity';
import { PublicationReactionTypeormEntity } from '../persistence/typeorm/entities/publication-reaction-typeorm.entity';
import {
  PUBLICATION_CURRENT_ACTOR_PORT,
  PUBLICATION_REPOSITORY_PORT,
} from '../../application/use-cases/create-publication/create-publication.use-case';
import {
  publicationCommentRepositoryProvider,
  publicationCurrentActorProvider,
  publicationFollowedUsersQueryProvider,
  publicationReactionRepositoryProvider,
  publicationRepositoryProvider,
} from './publication-repository.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PublicationTypeormEntity,
      PublicationReactionTypeormEntity,
      PublicationCommentTypeormEntity,
      ProfileFollowTypeormEntity,
    ]),
  ],
  providers: [
    publicationRepositoryProvider,
    publicationCurrentActorProvider,
    publicationReactionRepositoryProvider,
    publicationCommentRepositoryProvider,
    publicationFollowedUsersQueryProvider,
  ],
  exports: [
    PUBLICATION_REPOSITORY_PORT,
    PUBLICATION_CURRENT_ACTOR_PORT,
    PUBLICATION_REACTION_REPOSITORY_PORT,
    PUBLICATION_COMMENT_REPOSITORY_PORT,
    PUBLICATION_FOLLOWED_USERS_QUERY_PORT,
  ],
})
export class PublicationInfrastructureModule {}

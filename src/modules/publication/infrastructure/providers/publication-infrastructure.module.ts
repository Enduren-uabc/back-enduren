import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../../../shared/storage/storage.module';
import { PUBLICATION_MEDIA_REPOSITORY_PORT } from '../../domain/repositories/publication-media.repository';
import { PUBLICATION_REACTION_REPOSITORY_PORT } from '../../application/use-cases/add-publication-reaction/add-publication-reaction.use-case';
import { PUBLICATION_COMMENT_REPOSITORY_PORT } from '../../application/use-cases/create-publication-comment/create-publication-comment.use-case';
import { PUBLICATION_FOLLOWED_USERS_QUERY_PORT } from '../../application/use-cases/list-publications/list-publications.use-case';
import { WORKOUT_SESSION_QUERY_PORT } from '../../application/ports/workout-session-query.port';
import { AUTHOR_PROFILE_QUERY_PORT } from '../../application/ports/author-profile-query.port';
import { ProfileFollowTypeormEntity } from '../../../profile/infrastructure/persistence/typeorm/entities/profile-follow-typeorm.entity';
import { SocialProfileTypeormEntity } from '../../../profile/infrastructure/persistence/typeorm/entities/social-profile-typeorm.entity';
import { UserTypeormEntity } from '../../../users/infrastructure/persistence/typeorm/entities/user-typeorm.entity';
import { PublicationTypeormEntity } from '../persistence/typeorm/entities/publication-typeorm.entity';
import { PublicationCommentTypeormEntity } from '../persistence/typeorm/entities/publication-comment-typeorm.entity';
import { PublicationReactionTypeormEntity } from '../persistence/typeorm/entities/publication-reaction-typeorm.entity';
import { PublicationMediaTypeormEntity } from '../persistence/typeorm/entities/publication-media-typeorm.entity';
import { PUBLICATION_REPOSITORY_PORT } from '../../application/use-cases/create-publication/create-publication.use-case';
import {
  publicationAuthorProfileQueryProvider,
  publicationCommentRepositoryProvider,
  publicationFollowedUsersQueryProvider,
  publicationMediaRepositoryProvider,
  publicationReactionRepositoryProvider,
  publicationRepositoryProvider,
  publicationWorkoutSessionQueryProvider,
} from './publication-repository.provider';
import { PublicationMediaStorageStrategy } from '../storage/publication-media-storage.strategy';
import { UploadPublicationMediaUseCase } from '../../application/use-cases/upload-publication-media/upload-publication-media.use-case';
import { DeletePublicationMediaUseCase } from '../../application/use-cases/delete-publication-media/delete-publication-media.use-case';

@Module({
  imports: [
    StorageModule.forFeature(PublicationMediaStorageStrategy),
    TypeOrmModule.forFeature([
      PublicationTypeormEntity,
      PublicationReactionTypeormEntity,
      PublicationCommentTypeormEntity,
      ProfileFollowTypeormEntity,
      SocialProfileTypeormEntity,
      UserTypeormEntity,
      PublicationMediaTypeormEntity,
    ]),
  ],
  providers: [
    publicationRepositoryProvider,
    publicationReactionRepositoryProvider,
    publicationCommentRepositoryProvider,
    publicationMediaRepositoryProvider,
    UploadPublicationMediaUseCase,
    DeletePublicationMediaUseCase,
    publicationFollowedUsersQueryProvider,
    publicationWorkoutSessionQueryProvider,
    publicationAuthorProfileQueryProvider,
  ],
  exports: [
    PUBLICATION_REPOSITORY_PORT,
    PUBLICATION_REACTION_REPOSITORY_PORT,
    PUBLICATION_COMMENT_REPOSITORY_PORT,
    PUBLICATION_MEDIA_REPOSITORY_PORT,
    PUBLICATION_FOLLOWED_USERS_QUERY_PORT,
    WORKOUT_SESSION_QUERY_PORT,
    AUTHOR_PROFILE_QUERY_PORT,
  ],
})
export class PublicationInfrastructureModule {}

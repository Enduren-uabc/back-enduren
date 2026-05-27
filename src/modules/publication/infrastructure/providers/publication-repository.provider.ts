import { PUBLICATION_REPOSITORY_PORT } from '../../application/use-cases/create-publication/create-publication.use-case';
import { PUBLICATION_REACTION_REPOSITORY_PORT } from '../../application/use-cases/add-publication-reaction/add-publication-reaction.use-case';
import { PUBLICATION_COMMENT_REPOSITORY_PORT } from '../../application/use-cases/create-publication-comment/create-publication-comment.use-case';
import { PUBLICATION_FOLLOWED_USERS_QUERY_PORT } from '../../application/use-cases/list-publications/list-publications.use-case';
import { WORKOUT_SESSION_QUERY_PORT } from '../../application/ports/workout-session-query.port';
import { TypeormFollowedUsersQueryAdapter } from '../queries/typeorm-followed-users-query.adapter';
import { TypeormWorkoutSessionQueryAdapter } from '../queries/typeorm-workout-session-query.adapter';
import { TypeormPublicationRepository } from '../persistence/typeorm/repositories/typeorm-publication.repository';
import { TypeormPublicationCommentRepository } from '../persistence/typeorm/repositories/typeorm-publication-comment.repository';
import { TypeormPublicationReactionRepository } from '../persistence/typeorm/repositories/typeorm-publication-reaction.repository';
import { TypeormPublicationMediaRepository } from '../persistence/typeorm/repositories/typeorm-publication-media.repository';
import { PUBLICATION_MEDIA_REPOSITORY_PORT } from '../../domain/repositories/publication-media.repository';

import { AUTHOR_PROFILE_QUERY_PORT } from '../../application/ports/author-profile-query.port';
import { TypeormAuthorProfileQueryAdapter } from '../queries/typeorm-author-profile-query.adapter';

export const publicationRepositoryProvider = {
  provide: PUBLICATION_REPOSITORY_PORT,
  useClass: TypeormPublicationRepository,
};

export const publicationAuthorProfileQueryProvider = {
  provide: AUTHOR_PROFILE_QUERY_PORT,
  useClass: TypeormAuthorProfileQueryAdapter,
};

export const publicationReactionRepositoryProvider = {
  provide: PUBLICATION_REACTION_REPOSITORY_PORT,
  useClass: TypeormPublicationReactionRepository,
};

export const publicationCommentRepositoryProvider = {
  provide: PUBLICATION_COMMENT_REPOSITORY_PORT,
  useClass: TypeormPublicationCommentRepository,
};

export const publicationFollowedUsersQueryProvider = {
  provide: PUBLICATION_FOLLOWED_USERS_QUERY_PORT,
  useClass: TypeormFollowedUsersQueryAdapter,
};

export const publicationWorkoutSessionQueryProvider = {
  provide: WORKOUT_SESSION_QUERY_PORT,
  useClass: TypeormWorkoutSessionQueryAdapter,
};

export const publicationMediaRepositoryProvider = {
  provide: PUBLICATION_MEDIA_REPOSITORY_PORT,
  useClass: TypeormPublicationMediaRepository,
};

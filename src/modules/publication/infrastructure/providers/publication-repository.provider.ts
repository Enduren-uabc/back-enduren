import {
  PUBLICATION_CURRENT_ACTOR_PORT,
  PUBLICATION_REPOSITORY_PORT,
} from '../../application/use-cases/create-publication/create-publication.use-case';
import { PUBLICATION_REACTION_REPOSITORY_PORT } from '../../application/use-cases/add-publication-reaction/add-publication-reaction.use-case';
import { PUBLICATION_COMMENT_REPOSITORY_PORT } from '../../application/use-cases/create-publication-comment/create-publication-comment.use-case';
import { PUBLICATION_FOLLOWED_USERS_QUERY_PORT } from '../../application/use-cases/list-publications/list-publications.use-case';
import { TypeormFollowedUsersQueryAdapter } from '../queries/typeorm-followed-users-query.adapter';
import { TypeormPublicationRepository } from '../persistence/typeorm/repositories/typeorm-publication.repository';
import { TypeormPublicationCommentRepository } from '../persistence/typeorm/repositories/typeorm-publication-comment.repository';
import { TypeormPublicationReactionRepository } from '../persistence/typeorm/repositories/typeorm-publication-reaction.repository';
import { DevPublicationActorService } from './publication-current-actor.provider';

export const publicationRepositoryProvider = {
  provide: PUBLICATION_REPOSITORY_PORT,
  useClass: TypeormPublicationRepository,
};

export const publicationCurrentActorProvider = {
  provide: PUBLICATION_CURRENT_ACTOR_PORT,
  useClass: DevPublicationActorService,
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

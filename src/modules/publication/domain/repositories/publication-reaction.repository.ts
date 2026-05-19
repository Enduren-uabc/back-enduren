import { PublicationReaction } from '../entities/publication-reaction.entity';

export interface PublicationReactionRepository {
  save(reaction: PublicationReaction): Promise<PublicationReaction>;
  findByPublicationIdAndAuthorUserId(
    publicationId: string,
    authorUserId: string,
  ): Promise<PublicationReaction | null>;
  delete(reaction: PublicationReaction): Promise<void>;
}

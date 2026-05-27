import { PublicationReaction } from '../entities/publication-reaction.entity';

export interface PublicationReactionRepository {
  save(reaction: PublicationReaction): Promise<PublicationReaction>;
  findByPublicationIdAndAuthorUserId(
    publicationId: string,
    authorUserId: string,
  ): Promise<PublicationReaction | null>;
  delete(reaction: PublicationReaction): Promise<void>;
  countByPublicationIds(publicationIds: string[]): Promise<Map<string, number>>;
  findRecentAuthorUserIdsByPublicationIds(
    publicationIds: string[],
    limit: number,
  ): Promise<Map<string, string[]>>;
}

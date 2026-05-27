import { PublicationComment } from '../entities/publication-comment.entity';

export interface PublicationCommentRepository {
  save(comment: PublicationComment): Promise<PublicationComment>;
  findById(id: string): Promise<PublicationComment | null>;
  findByPublicationId(publicationId: string): Promise<PublicationComment[]>;
  delete(comment: PublicationComment): Promise<void>;
  countByPublicationIds(publicationIds: string[]): Promise<Map<string, number>>;
  findRecentByPublicationIds(
    publicationIds: string[],
    limit: number,
  ): Promise<Map<string, PublicationComment[]>>;
}

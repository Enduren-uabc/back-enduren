import { PublicationComment } from '../entities/publication-comment.entity';

export interface PublicationCommentRepository {
  save(comment: PublicationComment): Promise<PublicationComment>;
  findById(id: string): Promise<PublicationComment | null>;
  findByPublicationId(publicationId: string): Promise<PublicationComment[]>;
  delete(comment: PublicationComment): Promise<void>;
}

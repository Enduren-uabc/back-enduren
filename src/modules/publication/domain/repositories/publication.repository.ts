import { Publication } from '../entities/publication.entity';

export interface PublicationRepository {
  save(publication: Publication): Promise<Publication>;
  findById(id: string): Promise<Publication | null>;
  findByIdAndAuthorUserId(
    id: string,
    authorUserId: string,
  ): Promise<Publication | null>;
  delete(publication: Publication): Promise<void>;
  findFeed(input: { limit: number; offset: number }): Promise<Publication[]>;
  countFeed(): Promise<number>;
  findFeedByAuthorUserIds(input: {
    authorUserIds: string[];
    limit: number;
    offset: number;
  }): Promise<Publication[]>;
  countFeedByAuthorUserIds(authorUserIds: string[]): Promise<number>;
}

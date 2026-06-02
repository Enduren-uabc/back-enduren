import { PublicationMedia } from '../entities/publication-media.entity';

export const PUBLICATION_MEDIA_REPOSITORY_PORT = Symbol(
  'PUBLICATION_MEDIA_REPOSITORY_PORT',
);

export interface PublicationMediaRepository {
  save(media: PublicationMedia): Promise<PublicationMedia>;
  findById(id: string): Promise<PublicationMedia | null>;
  findByPublicationId(publicationId: string): Promise<PublicationMedia[]>;
  delete(id: string): Promise<void>;
  linkToPublication(mediaIds: string[], publicationId: string): Promise<void>;
  deleteByPublicationId(publicationId: string): Promise<void>;
}

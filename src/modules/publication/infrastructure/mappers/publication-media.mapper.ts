import { PublicationMedia } from '../../domain/entities/publication-media.entity';
import { PublicationMediaTypeormEntity } from '../persistence/typeorm/entities/publication-media-typeorm.entity';

export class PublicationMediaMapper {
  static toDomain(orm: PublicationMediaTypeormEntity): PublicationMedia {
    return PublicationMedia.reconstitute({
      id: orm.id,
      publicationId: orm.publicationId,
      url: orm.url,
      fileName: orm.fileName,
      fileSize: orm.fileSize,
      mimeType: orm.mimeType,
      sortOrder: orm.sortOrder,
      createdAt: orm.createdAt,
    });
  }

  static toOrm(domain: PublicationMedia): PublicationMediaTypeormEntity {
    const orm = new PublicationMediaTypeormEntity();
    orm.id = domain.id;
    orm.publicationId = domain.publicationId;
    orm.url = domain.url;
    orm.fileName = domain.fileName;
    orm.fileSize = domain.fileSize;
    orm.mimeType = domain.mimeType;
    orm.sortOrder = domain.sortOrder;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}

import { Publication } from '../../domain/entities/publication.entity';
import { PublicationContent } from '../../domain/value-objects/publication-content.value-object';
import { PublicationMediaUrls } from '../../domain/value-objects/publication-media-urls.value-object';
import { PublicationTitle } from '../../domain/value-objects/publication-title.value-object';
import { PublicationTypeormEntity } from '../persistence/typeorm/entities/publication-typeorm.entity';

export class PublicationPersistenceMapper {
  public static toDomain(ormEntity: PublicationTypeormEntity): Publication {
    return Publication.reconstitute(
      ormEntity.id,
      ormEntity.authorUserId,
      PublicationTitle.reconstitute(ormEntity.title),
      PublicationContent.reconstitute(ormEntity.content),
      PublicationMediaUrls.reconstitute(ormEntity.mediaUrls ?? []),
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  public static toOrm(publication: Publication): PublicationTypeormEntity {
    const ormEntity = new PublicationTypeormEntity();
    ormEntity.id = publication.id;
    ormEntity.authorUserId = publication.authorUserId;
    ormEntity.title = publication.title.value;
    ormEntity.content = publication.content.value;
    ormEntity.mediaUrls = publication.mediaUrls.values;
    ormEntity.createdAt = publication.createdAt;
    ormEntity.updatedAt = publication.updatedAt;
    return ormEntity;
  }
}

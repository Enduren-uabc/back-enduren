import { PublicationComment } from '../../domain/entities/publication-comment.entity';
import { PublicationCommentContent } from '../../domain/value-objects/publication-comment-content.value-object';
import { PublicationCommentTypeormEntity } from '../persistence/typeorm/entities/publication-comment-typeorm.entity';

export class PublicationCommentPersistenceMapper {
  public static toDomain(
    ormEntity: PublicationCommentTypeormEntity,
  ): PublicationComment {
    return PublicationComment.reconstitute(
      ormEntity.id,
      ormEntity.publicationId,
      ormEntity.authorUserId,
      PublicationCommentContent.reconstitute(ormEntity.content),
      ormEntity.createdAt,
    );
  }

  public static toOrm(
    comment: PublicationComment,
  ): PublicationCommentTypeormEntity {
    const ormEntity = new PublicationCommentTypeormEntity();
    ormEntity.id = comment.id;
    ormEntity.publicationId = comment.publicationId;
    ormEntity.authorUserId = comment.authorUserId;
    ormEntity.content = comment.content.value;
    ormEntity.createdAt = comment.createdAt;
    return ormEntity;
  }
}

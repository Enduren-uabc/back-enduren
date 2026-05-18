import { PublicationReaction } from '../../domain/entities/publication-reaction.entity';
import { PublicationReactionTypeormEntity } from '../persistence/typeorm/entities/publication-reaction-typeorm.entity';

export class PublicationReactionPersistenceMapper {
  public static toDomain(
    ormEntity: PublicationReactionTypeormEntity,
  ): PublicationReaction {
    return PublicationReaction.reconstitute(
      ormEntity.id,
      ormEntity.publicationId,
      ormEntity.authorUserId,
      ormEntity.createdAt,
    );
  }

  public static toOrm(
    reaction: PublicationReaction,
  ): PublicationReactionTypeormEntity {
    const ormEntity = new PublicationReactionTypeormEntity();
    ormEntity.id = reaction.id;
    ormEntity.publicationId = reaction.publicationId;
    ormEntity.authorUserId = reaction.authorUserId;
    ormEntity.createdAt = reaction.createdAt;
    return ormEntity;
  }
}

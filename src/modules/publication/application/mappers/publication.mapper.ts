import { Publication } from '../../domain/entities/publication.entity';
import { PublicationComment } from '../../domain/entities/publication-comment.entity';
import { PublicationReaction } from '../../domain/entities/publication-reaction.entity';
import { PublicationCommentDto } from '../dto/publication-comment.dto';
import { PublicationDto } from '../dto/publication.dto';
import { PublicationReactionDto } from '../dto/publication-reaction.dto';

export class PublicationApplicationMapper {
  public static toDto(publication: Publication): PublicationDto {
    return {
      id: publication.id,
      authorUserId: publication.authorUserId,
      title: publication.title.value,
      content: publication.content.value,
      mediaUrls: publication.mediaUrls.values,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };
  }

  public static reactionToDto(
    reaction: PublicationReaction,
  ): PublicationReactionDto {
    return {
      id: reaction.id,
      publicationId: reaction.publicationId,
      authorUserId: reaction.authorUserId,
      createdAt: reaction.createdAt,
    };
  }

  public static commentToDto(
    comment: PublicationComment,
  ): PublicationCommentDto {
    return {
      id: comment.id,
      publicationId: comment.publicationId,
      authorUserId: comment.authorUserId,
      content: comment.content.value,
      createdAt: comment.createdAt,
    };
  }
}

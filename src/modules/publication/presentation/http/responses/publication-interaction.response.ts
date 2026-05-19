import { PublicationCommentDto } from '../../../application/dto/publication-comment.dto';
import { PublicationReactionDto } from '../../../application/dto/publication-reaction.dto';

export class PublicationReactionResponseDto {
  id!: string;
  publicationId!: string;
  authorUserId!: string;
  createdAt!: Date;
}

export class DeletePublicationReactionResponseDto {
  publicationId!: string;
  deleted!: boolean;
}

export class PublicationCommentResponseDto {
  id!: string;
  publicationId!: string;
  authorUserId!: string;
  content!: string;
  createdAt!: Date;
}

export class ListPublicationCommentsResponseDto {
  items!: PublicationCommentResponseDto[];
}

export class DeletePublicationCommentResponseDto {
  id!: string;
  deleted!: boolean;
}

export class PublicationInteractionPresenter {
  public static reactionToHttp(
    reaction: PublicationReactionDto,
  ): PublicationReactionResponseDto {
    const response = new PublicationReactionResponseDto();
    response.id = reaction.id;
    response.publicationId = reaction.publicationId;
    response.authorUserId = reaction.authorUserId;
    response.createdAt = reaction.createdAt;
    return response;
  }

  public static commentToHttp(
    comment: PublicationCommentDto,
  ): PublicationCommentResponseDto {
    const response = new PublicationCommentResponseDto();
    response.id = comment.id;
    response.publicationId = comment.publicationId;
    response.authorUserId = comment.authorUserId;
    response.content = comment.content;
    response.createdAt = comment.createdAt;
    return response;
  }

  public static commentsToHttp(
    comments: PublicationCommentDto[],
  ): ListPublicationCommentsResponseDto {
    const response = new ListPublicationCommentsResponseDto();
    response.items = comments.map((comment) =>
      PublicationInteractionPresenter.commentToHttp(comment),
    );
    return response;
  }
}

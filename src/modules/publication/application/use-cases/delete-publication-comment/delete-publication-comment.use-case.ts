import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface DeletePublicationCommentInput {
  commentId: string;
}

export interface DeletePublicationCommentOutput {
  id: string;
  deleted: boolean;
}

export class DeletePublicationCommentUseCase {
  constructor(
    private readonly commentRepository: PublicationCommentRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: DeletePublicationCommentInput,
  ): Promise<DeletePublicationCommentOutput> {
    const comment = await this.commentRepository.findById(input.commentId);

    if (comment === null) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_COMMENT_NOT_FOUND,
        `Publication comment with id "${input.commentId}" not found`,
        { commentId: input.commentId },
      );
    }

    comment.ensureOwnedBy(actor.userId);
    await this.commentRepository.delete(comment);

    return { id: comment.id, deleted: true };
  }
}

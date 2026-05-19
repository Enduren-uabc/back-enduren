import { Controller, Delete, Inject, Param, UseFilters } from '@nestjs/common';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { DeletePublicationCommentUseCase } from '../../../application/use-cases/delete-publication-comment/delete-publication-comment.use-case';
import { PUBLICATION_COMMENT_REPOSITORY_PORT } from '../../../application/use-cases/create-publication-comment/create-publication-comment.use-case';
import { PUBLICATION_CURRENT_ACTOR_PORT } from '../../../application/use-cases/create-publication/create-publication.use-case';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { PublicationDomainErrorFilter } from '../filters/publication-domain-error.filter';
import { DeletePublicationCommentResponseDto } from '../responses/publication-interaction.response';

@Controller('comments')
@UseFilters(PublicationDomainErrorFilter)
export class PublicationCommentController {
  private readonly deleteCommentUseCase: DeletePublicationCommentUseCase;

  constructor(
    @Inject(PUBLICATION_COMMENT_REPOSITORY_PORT)
    commentRepository: PublicationCommentRepository,
    @Inject(PUBLICATION_CURRENT_ACTOR_PORT)
    private readonly currentActor: CurrentActor,
  ) {
    this.deleteCommentUseCase = new DeletePublicationCommentUseCase(
      commentRepository,
    );
  }

  @Delete(':commentId')
  public async delete(
    @Param('commentId') commentId: string,
  ): Promise<DeletePublicationCommentResponseDto> {
    const result = await this.deleteCommentUseCase.execute(this.currentActor, {
      commentId,
    });

    const response = new DeletePublicationCommentResponseDto();
    response.id = result.id;
    response.deleted = result.deleted;
    return response;
  }
}

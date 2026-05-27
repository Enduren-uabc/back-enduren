import {
  Controller,
  Delete,
  Inject,
  Param,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { CurrentActor } from '../../../application/ports/current-actor.port';
import { DeletePublicationCommentUseCase } from '../../../application/use-cases/delete-publication-comment/delete-publication-comment.use-case';
import { PUBLICATION_COMMENT_REPOSITORY_PORT } from '../../../application/use-cases/create-publication-comment/create-publication-comment.use-case';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { PublicationDomainErrorFilter } from '../filters/publication-domain-error.filter';
import { DeletePublicationCommentResponseDto } from '../responses/publication-interaction.response';
import { JwtAuthGuard } from '../../../../auth/presentation/http/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../auth/presentation/http/decorators/current-user.decorator';
import { JwtPayload } from '../../../../auth/presentation/http/strategies/jwt.strategy';

@Controller('comments')
@UseGuards(JwtAuthGuard)
@UseFilters(PublicationDomainErrorFilter)
export class PublicationCommentController {
  private readonly deleteCommentUseCase: DeletePublicationCommentUseCase;

  constructor(
    @Inject(PUBLICATION_COMMENT_REPOSITORY_PORT)
    commentRepository: PublicationCommentRepository,
  ) {
    this.deleteCommentUseCase = new DeletePublicationCommentUseCase(
      commentRepository,
    );
  }

  private getActor(user: JwtPayload): CurrentActor {
    return { userId: user.sub };
  }

  @Delete(':commentId')
  public async delete(
    @CurrentUser() user: JwtPayload,
    @Param('commentId') commentId: string,
  ): Promise<DeletePublicationCommentResponseDto> {
    const result = await this.deleteCommentUseCase.execute(
      this.getActor(user),
      {
        commentId,
      },
    );

    const response = new DeletePublicationCommentResponseDto();
    response.id = result.id;
    response.deleted = result.deleted;
    return response;
  }
}

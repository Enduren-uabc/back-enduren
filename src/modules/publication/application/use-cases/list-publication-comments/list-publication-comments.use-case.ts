import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { PublicationCommentDto } from '../../dto/publication-comment.dto';
import { PublicationApplicationMapper } from '../../mappers/publication.mapper';
import { CurrentActor } from '../../ports/current-actor.port';

export interface ListPublicationCommentsInput {
  publicationId: string;
}

export class ListPublicationCommentsUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly commentRepository: PublicationCommentRepository,
  ) {}

  public async execute(
    _actor: CurrentActor,
    input: ListPublicationCommentsInput,
  ): Promise<PublicationCommentDto[]> {
    const publication = await this.publicationRepository.findById(
      input.publicationId,
    );

    if (publication === null) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_NOT_FOUND,
        `Publication with id "${input.publicationId}" not found`,
        { publicationId: input.publicationId },
      );
    }

    const comments = await this.commentRepository.findByPublicationId(
      input.publicationId,
    );

    return comments.map((comment) =>
      PublicationApplicationMapper.commentToDto(comment),
    );
  }
}

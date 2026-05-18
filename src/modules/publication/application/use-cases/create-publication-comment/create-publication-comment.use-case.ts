import { PublicationComment } from '../../../domain/entities/publication-comment.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationCommentRepository } from '../../../domain/repositories/publication-comment.repository';
import { PublicationCommentContent } from '../../../domain/value-objects/publication-comment-content.value-object';
import { CreatePublicationCommentDto } from '../../dto/create-publication-comment.dto';
import { PublicationCommentDto } from '../../dto/publication-comment.dto';
import { PublicationApplicationMapper } from '../../mappers/publication.mapper';
import { CurrentActor } from '../../ports/current-actor.port';

export const PUBLICATION_COMMENT_REPOSITORY_PORT = Symbol(
  'PUBLICATION_COMMENT_REPOSITORY_PORT',
);

export class CreatePublicationCommentUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly commentRepository: PublicationCommentRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: CreatePublicationCommentDto,
  ): Promise<PublicationCommentDto> {
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

    const comment = PublicationComment.create(
      crypto.randomUUID(),
      input.publicationId,
      actor.userId,
      PublicationCommentContent.create(input.content),
    );

    const saved = await this.commentRepository.save(comment);
    return PublicationApplicationMapper.commentToDto(saved);
  }
}

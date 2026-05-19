import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationMediaUrls } from '../../../domain/value-objects/publication-media-urls.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { PublicationDto } from '../../dto/publication.dto';
import { UpdatePublicationDto } from '../../dto/update-publication.dto';
import { PublicationApplicationMapper } from '../../mappers/publication.mapper';
import { CurrentActor } from '../../ports/current-actor.port';

export class UpdatePublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  public async execute(
    actor: CurrentActor,
    input: UpdatePublicationDto,
  ): Promise<PublicationDto> {
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

    publication.ensureOwnedBy(actor.userId);

    const updated = publication.update({
      title:
        input.title !== undefined
          ? PublicationTitle.create(input.title)
          : undefined,
      content:
        input.content !== undefined
          ? PublicationContent.create(input.content)
          : undefined,
      mediaUrls:
        input.mediaUrls !== undefined
          ? PublicationMediaUrls.create(input.mediaUrls)
          : undefined,
    });

    const saved = await this.publicationRepository.save(updated);
    return PublicationApplicationMapper.toDto(saved);
  }
}

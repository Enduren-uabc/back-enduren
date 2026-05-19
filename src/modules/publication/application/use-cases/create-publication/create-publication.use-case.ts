import { Publication } from '../../../domain/entities/publication.entity';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationContent } from '../../../domain/value-objects/publication-content.value-object';
import { PublicationMediaUrls } from '../../../domain/value-objects/publication-media-urls.value-object';
import { PublicationTitle } from '../../../domain/value-objects/publication-title.value-object';
import { CreatePublicationDto } from '../../dto/create-publication.dto';
import { PublicationDto } from '../../dto/publication.dto';
import { PublicationApplicationMapper } from '../../mappers/publication.mapper';
import { CurrentActor } from '../../ports/current-actor.port';

export const PUBLICATION_REPOSITORY_PORT = Symbol(
  'PUBLICATION_REPOSITORY_PORT',
);
export const PUBLICATION_CURRENT_ACTOR_PORT = Symbol(
  'PUBLICATION_CURRENT_ACTOR_PORT',
);

export class CreatePublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  public async execute(
    actor: CurrentActor,
    input: CreatePublicationDto,
  ): Promise<PublicationDto> {
    const publication = Publication.create(
      crypto.randomUUID(),
      actor.userId,
      PublicationTitle.create(input.title),
      PublicationContent.create(input.content),
      PublicationMediaUrls.create(input.mediaUrls ?? []),
    );

    const saved = await this.publicationRepository.save(publication);
    return PublicationApplicationMapper.toDto(saved);
  }
}

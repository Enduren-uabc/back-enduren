import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface DeletePublicationInput {
  publicationId: string;
}

export interface DeletePublicationOutput {
  id: string;
  deleted: boolean;
}

export class DeletePublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  public async execute(
    actor: CurrentActor,
    input: DeletePublicationInput,
  ): Promise<DeletePublicationOutput> {
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
    await this.publicationRepository.delete(publication);

    return { id: publication.id, deleted: true };
  }
}

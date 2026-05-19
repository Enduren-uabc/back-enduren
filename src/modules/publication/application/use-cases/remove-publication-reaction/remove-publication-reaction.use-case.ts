import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationReactionRepository } from '../../../domain/repositories/publication-reaction.repository';
import { CurrentActor } from '../../ports/current-actor.port';

export interface RemovePublicationReactionInput {
  publicationId: string;
}

export interface RemovePublicationReactionOutput {
  publicationId: string;
  deleted: boolean;
}

export class RemovePublicationReactionUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly reactionRepository: PublicationReactionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: RemovePublicationReactionInput,
  ): Promise<RemovePublicationReactionOutput> {
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

    const reaction =
      await this.reactionRepository.findByPublicationIdAndAuthorUserId(
        input.publicationId,
        actor.userId,
      );

    if (reaction === null) {
      return { publicationId: input.publicationId, deleted: false };
    }

    await this.reactionRepository.delete(reaction);
    return { publicationId: input.publicationId, deleted: true };
  }
}

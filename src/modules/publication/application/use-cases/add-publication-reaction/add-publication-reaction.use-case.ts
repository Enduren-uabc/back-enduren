import { PublicationReaction } from '../../../domain/entities/publication-reaction.entity';
import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationReactionRepository } from '../../../domain/repositories/publication-reaction.repository';
import { PublicationReactionDto } from '../../dto/publication-reaction.dto';
import { PublicationApplicationMapper } from '../../mappers/publication.mapper';
import { CurrentActor } from '../../ports/current-actor.port';

export const PUBLICATION_REACTION_REPOSITORY_PORT = Symbol(
  'PUBLICATION_REACTION_REPOSITORY_PORT',
);

export interface AddPublicationReactionInput {
  publicationId: string;
}

export class AddPublicationReactionUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly reactionRepository: PublicationReactionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: AddPublicationReactionInput,
  ): Promise<PublicationReactionDto> {
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

    const existingReaction =
      await this.reactionRepository.findByPublicationIdAndAuthorUserId(
        input.publicationId,
        actor.userId,
      );

    if (existingReaction !== null) {
      return PublicationApplicationMapper.reactionToDto(existingReaction);
    }

    const reaction = PublicationReaction.create(
      crypto.randomUUID(),
      input.publicationId,
      actor.userId,
    );

    const saved = await this.reactionRepository.save(reaction);
    return PublicationApplicationMapper.reactionToDto(saved);
  }
}

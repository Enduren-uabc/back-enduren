import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationReaction } from '../../../../domain/entities/publication-reaction.entity';
import { PublicationReactionRepository } from '../../../../domain/repositories/publication-reaction.repository';
import { PublicationReactionPersistenceMapper } from '../../../mappers/publication-reaction.mapper';
import { PublicationReactionTypeormEntity } from '../entities/publication-reaction-typeorm.entity';

@Injectable()
export class TypeormPublicationReactionRepository implements PublicationReactionRepository {
  constructor(
    @InjectRepository(PublicationReactionTypeormEntity)
    private readonly ormRepo: Repository<PublicationReactionTypeormEntity>,
  ) {}

  public async save(
    reaction: PublicationReaction,
  ): Promise<PublicationReaction> {
    const saved = await this.ormRepo.save(
      PublicationReactionPersistenceMapper.toOrm(reaction),
    );
    return PublicationReactionPersistenceMapper.toDomain(saved);
  }

  public async findByPublicationIdAndAuthorUserId(
    publicationId: string,
    authorUserId: string,
  ): Promise<PublicationReaction | null> {
    const ormEntity = await this.ormRepo.findOne({
      where: { publicationId, authorUserId },
    });
    return ormEntity
      ? PublicationReactionPersistenceMapper.toDomain(ormEntity)
      : null;
  }

  public async delete(reaction: PublicationReaction): Promise<void> {
    await this.ormRepo.delete({ id: reaction.id });
  }
}

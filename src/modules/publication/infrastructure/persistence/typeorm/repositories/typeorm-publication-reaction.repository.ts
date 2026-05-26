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

  public async countByPublicationIds(
    publicationIds: string[],
  ): Promise<Map<string, number>> {
    if (publicationIds.length === 0) return new Map();

    const rows = await this.ormRepo
      .createQueryBuilder('r')
      .select('r.publication_id', 'publicationId')
      .addSelect('COUNT(*)', 'count')
      .where('r.publication_id IN (:...publicationIds)', { publicationIds })
      .groupBy('r.publication_id')
      .getRawMany();

    return new Map(
      rows.map((row: { publicationid: string; count: string }) => [
        row.publicationid,
        parseInt(row.count, 10),
      ]),
    );
  }

  public async findRecentAuthorUserIdsByPublicationIds(
    publicationIds: string[],
    limit: number,
  ): Promise<Map<string, string[]>> {
    if (publicationIds.length === 0) return new Map();

    const rows: { publicationid: string; authoruserid: string }[] =
      await this.ormRepo.query(
        `SELECT r.publication_id, r.author_user_id
         FROM publication_reactions r
         WHERE r.publication_id = ANY($1)
         ORDER BY r.created_at DESC`,
        [publicationIds],
      );

    const result = new Map<string, string[]>();
    const seen = new Map<string, Set<string>>();

    for (const row of rows) {
      const pubId = row.publicationid;
      const userId = row.authoruserid;
      if (!seen.has(pubId)) seen.set(pubId, new Set());
      if (seen.get(pubId)!.size >= limit) continue;
      if (seen.get(pubId)!.has(userId)) continue;
      seen.get(pubId)!.add(userId);
      if (!result.has(pubId)) result.set(pubId, []);
      result.get(pubId)!.push(userId);
    }

    return result;
  }
}

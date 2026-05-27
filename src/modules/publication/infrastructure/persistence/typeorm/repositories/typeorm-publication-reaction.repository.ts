import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  public async findPublicationIdsWithReactionByAuthorUserId(
    publicationIds: string[],
    authorUserId: string,
  ): Promise<Set<string>> {
    if (publicationIds.length === 0) return new Set();

    const rows = await this.ormRepo.find({
      where: { publicationId: In(publicationIds), authorUserId },
      select: { publicationId: true },
    });

    return new Set(rows.map((r) => r.publicationId));
  }

  public async countByPublicationIds(
    publicationIds: string[],
  ): Promise<Map<string, number>> {
    if (publicationIds.length === 0) return new Map();

    const rows: { publicationid: string; count: string }[] =
      await this.ormRepo.query(
        `SELECT r.publication_id AS publicationid, COUNT(*)::text AS count
         FROM publication_reactions r
         WHERE r.publication_id = ANY($1)
         GROUP BY r.publication_id`,
        [publicationIds],
      );

    return new Map(rows.map((r) => [r.publicationid, parseInt(r.count, 10)]));
  }

  public async findRecentAuthorUserIdsByPublicationIds(
    publicationIds: string[],
    limit: number,
  ): Promise<Map<string, string[]>> {
    if (publicationIds.length === 0) return new Map();

    const rows: { publicationid: string; authoruserid: string }[] =
      await this.ormRepo.query(
        `SELECT r.publication_id AS publicationid, r.author_user_id AS authoruserid
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

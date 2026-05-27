import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicationComment } from '../../../../domain/entities/publication-comment.entity';
import { PublicationCommentRepository } from '../../../../domain/repositories/publication-comment.repository';
import { PublicationCommentPersistenceMapper } from '../../../mappers/publication-comment.mapper';
import { PublicationCommentTypeormEntity } from '../entities/publication-comment-typeorm.entity';

@Injectable()
export class TypeormPublicationCommentRepository implements PublicationCommentRepository {
  constructor(
    @InjectRepository(PublicationCommentTypeormEntity)
    private readonly ormRepo: Repository<PublicationCommentTypeormEntity>,
  ) {}

  public async save(comment: PublicationComment): Promise<PublicationComment> {
    const saved = await this.ormRepo.save(
      PublicationCommentPersistenceMapper.toOrm(comment),
    );
    return PublicationCommentPersistenceMapper.toDomain(saved);
  }

  public async findById(id: string): Promise<PublicationComment | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { id } });
    return ormEntity
      ? PublicationCommentPersistenceMapper.toDomain(ormEntity)
      : null;
  }

  public async findByPublicationId(
    publicationId: string,
  ): Promise<PublicationComment[]> {
    const ormEntities = await this.ormRepo.find({
      where: { publicationId },
      order: { createdAt: 'ASC' },
    });

    return ormEntities.map((ormEntity) =>
      PublicationCommentPersistenceMapper.toDomain(ormEntity),
    );
  }

  public async delete(comment: PublicationComment): Promise<void> {
    await this.ormRepo.delete({ id: comment.id });
  }

  public async countByPublicationIds(
    publicationIds: string[],
  ): Promise<Map<string, number>> {
    if (publicationIds.length === 0) return new Map();

    const rows = await this.ormRepo
      .createQueryBuilder('c')
      .select('c.publication_id', 'publicationId')
      .addSelect('COUNT(*)', 'count')
      .where('c.publication_id IN (:...publicationIds)', { publicationIds })
      .groupBy('c.publication_id')
      .getRawMany();

    return new Map(
      rows.map((row: { publicationid: string; count: string }) => [
        row.publicationid,
        parseInt(row.count, 10),
      ]),
    );
  }

  public async findRecentByPublicationIds(
    publicationIds: string[],
    limit: number,
  ): Promise<Map<string, PublicationComment[]>> {
    if (publicationIds.length === 0) return new Map();

    const rows = await this.ormRepo.query(
      `SELECT c.id, c.publication_id, c.author_user_id, c.content, c.created_at
       FROM publication_comments c
       WHERE c.publication_id = ANY($1)
       ORDER BY c.created_at DESC`,
      [publicationIds],
    );

    const result = new Map<string, PublicationComment[]>();
    const counts = new Map<string, number>();

    for (const row of rows) {
      const pubId = row.publication_id;
      const currentCount = counts.get(pubId) ?? 0;
      if (currentCount >= limit) continue;

      const entity = new PublicationCommentTypeormEntity();
      entity.id = row.id;
      entity.publicationId = row.publication_id;
      entity.authorUserId = row.author_user_id;
      entity.content = row.content;
      entity.createdAt = row.created_at;

      const comment = PublicationCommentPersistenceMapper.toDomain(entity);

      if (!result.has(pubId)) result.set(pubId, []);
      result.get(pubId)!.push(comment);
      counts.set(pubId, currentCount + 1);
    }

    return result;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ProfilePublicationItem,
  ProfilePublicationPage,
  ProfilePublicationQueryPort,
} from '../../application/ports/profile-publication-query.port';
import { PublicationTypeormEntity } from '../../../publication/infrastructure/persistence/typeorm/entities/publication-typeorm.entity';

@Injectable()
export class TypeormProfilePublicationQueryAdapter implements ProfilePublicationQueryPort {
  constructor(
    @InjectRepository(PublicationTypeormEntity)
    private readonly publicationRepo: Repository<PublicationTypeormEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  public async findByAuthorUserId(input: {
    authorUserId: string;
    limit: number;
    offset: number;
  }): Promise<ProfilePublicationPage> {
    const [publications, total] = await this.publicationRepo.findAndCount({
      where: { authorUserId: input.authorUserId },
      order: { createdAt: 'DESC' },
      take: input.limit,
      skip: input.offset,
    });

    const publicationIds = publications.map((p) => p.id);

    // Batch load reaction counts
    const countRows: { publicationid: string; count: string }[] =
      publicationIds.length > 0
        ? await this.dataSource.query(
            `SELECT r.publication_id, COUNT(*)::text as count
             FROM publication_reactions r
             WHERE r.publication_id = ANY($1)
             GROUP BY r.publication_id`,
            [publicationIds],
          )
        : [];
    const reactionCounts = new Map(
      countRows.map((r) => [r.publicationid, parseInt(r.count, 10)]),
    );

    // Batch load recent reactor user IDs
    const reactorRows: { publicationid: string; authoruserid: string }[] =
      publicationIds.length > 0
        ? await this.dataSource.query(
            `SELECT r.publication_id, r.author_user_id
             FROM publication_reactions r
             WHERE r.publication_id = ANY($1)
             ORDER BY r.created_at DESC`,
            [publicationIds],
          )
        : [];

    const recentReactors = new Map<string, string[]>();
    const seen = new Map<string, Set<string>>();
    for (const row of reactorRows) {
      const pubId = row.publicationid;
      const userId = row.authoruserid;
      if (!seen.has(pubId)) seen.set(pubId, new Set());
      if (seen.get(pubId)!.size >= 3) continue;
      if (seen.get(pubId)!.has(userId)) continue;
      seen.get(pubId)!.add(userId);
      if (!recentReactors.has(pubId)) recentReactors.set(pubId, []);
      recentReactors.get(pubId)!.push(userId);
    }

    // Resolve display names for reactors
    const allReactorIds = [...new Set([...recentReactors.values()].flat())];
    const userRows: { id: string; username: string }[] =
      allReactorIds.length > 0
        ? await this.dataSource.query(
            `SELECT u.id, u.username FROM users u WHERE u.id = ANY($1)`,
            [allReactorIds],
          )
        : [];
    const reactorNameMap = new Map(userRows.map((u) => [u.id, u.username]));

    const items: ProfilePublicationItem[] = publications.map((publication) => ({
      id: publication.id,
      authorUserId: publication.authorUserId,
      title: publication.title,
      content: publication.content,
      mediaUrls: publication.mediaUrls ?? [],
      workoutSessionId: publication.workoutSessionId,
      exerciseSummary: publication.exerciseSummary,
      reactionCount: reactionCounts.get(publication.id) ?? 0,
      recentReactorNames: (recentReactors.get(publication.id) ?? []).map(
        (uid) => reactorNameMap.get(uid) ?? 'Usuario',
      ),
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    }));

    return {
      items,
      limit: input.limit,
      offset: input.offset,
      total,
      hasMore: input.offset + publications.length < total,
    };
  }
}

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
    currentUserId?: string;
  }): Promise<ProfilePublicationPage> {
    const [publications, total] = await this.publicationRepo.findAndCount({
      where: { authorUserId: input.authorUserId },
      order: { createdAt: 'DESC' },
      take: input.limit,
      skip: input.offset,
    });

    // Resolve author profile once since all publications belong to the same author
    const authorProfileRows: {
      display_name: string;
      avatar_url: string | null;
    }[] = await this.dataSource.query(
      `SELECT display_name, avatar_url FROM social_profiles WHERE user_id = $1`,
      [input.authorUserId],
    );
    const authorProfile = authorProfileRows[0];

    const publicationIds = publications.map((p) => p.id);

    // Batch load reaction counts
    const countRows: { publicationid: string; count: string }[] =
      publicationIds.length > 0
        ? await this.dataSource.query(
            `SELECT r.publication_id AS publicationid, COUNT(*)::text as count
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
            `SELECT r.publication_id AS publicationid, r.author_user_id AS authoruserid
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

    // Check which publications the current user has reacted to
    let reactedPublicationIds = new Set<string>();
    if (input.currentUserId && publicationIds.length > 0) {
      const reactorCheckRows: { publication_id: string }[] =
        await this.dataSource.query(
          `SELECT r.publication_id
           FROM publication_reactions r
           WHERE r.publication_id = ANY($1) AND r.author_user_id = $2`,
          [publicationIds, input.currentUserId],
        );
      reactedPublicationIds = new Set(
        reactorCheckRows.map((r) => r.publication_id),
      );
    }

    // Batch load comment counts
    const commentCountRows: { publicationid: string; count: string }[] =
      publicationIds.length > 0
        ? await this.dataSource.query(
            `SELECT c.publication_id AS publicationid, COUNT(*)::text as count
             FROM publication_comments c
             WHERE c.publication_id = ANY($1)
             GROUP BY c.publication_id`,
            [publicationIds],
          )
        : [];
    const commentCounts = new Map(
      commentCountRows.map((r) => [r.publicationid, parseInt(r.count, 10)]),
    );

    // Batch load recent comments (up to 2 per publication)
    const commentRows: {
      id: string;
      publication_id: string;
      author_user_id: string;
      content: string;
      created_at: Date;
    }[] =
      publicationIds.length > 0
        ? await this.dataSource.query(
            `SELECT c.id, c.publication_id, c.author_user_id, c.content, c.created_at
             FROM publication_comments c
             WHERE c.publication_id = ANY($1)
             ORDER BY c.created_at DESC`,
            [publicationIds],
          )
        : [];

    const recentCommentMap = new Map<string, typeof commentRows>();
    const commentCounters = new Map<string, number>();
    for (const row of commentRows) {
      const pubId = row.publication_id;
      const cnt = commentCounters.get(pubId) ?? 0;
      if (cnt >= 2) continue;
      if (!recentCommentMap.has(pubId)) recentCommentMap.set(pubId, []);
      recentCommentMap.get(pubId)!.push(row);
      commentCounters.set(pubId, cnt + 1);
    }

    // Resolve display names for comment authors
    const allCommentAuthorIds = [
      ...new Set(commentRows.map((r) => r.author_user_id)),
    ];
    const commentAuthorRows: { id: string; username: string }[] =
      allCommentAuthorIds.length > 0
        ? await this.dataSource.query(
            `SELECT u.id, u.username FROM users u WHERE u.id = ANY($1)`,
            [allCommentAuthorIds],
          )
        : [];
    const commentAuthorNameMap = new Map(
      commentAuthorRows.map((u) => [u.id, u.username]),
    );

    const items: ProfilePublicationItem[] = publications.map((publication) => {
      const rawComments = recentCommentMap.get(publication.id) ?? [];
      return {
        id: publication.id,
        authorUserId: publication.authorUserId,
        authorDisplayName: authorProfile?.display_name,
        authorAvatarUrl: authorProfile?.avatar_url ?? undefined,
        title: publication.title,
        content: publication.content,
        mediaUrls: publication.mediaUrls ?? [],
        workoutSessionId: publication.workoutSessionId,
        exerciseSummary: publication.exerciseSummary,
        reactionCount: reactionCounts.get(publication.id) ?? 0,
        recentReactorNames: (recentReactors.get(publication.id) ?? []).map(
          (uid) => reactorNameMap.get(uid) ?? 'Usuario',
        ),
        likedByMe: reactedPublicationIds.has(publication.id),
        commentCount: commentCounts.get(publication.id) ?? 0,
        recentComments: rawComments.map((rc) => ({
          id: rc.id,
          publicationId: rc.publication_id,
          authorUserId: rc.author_user_id,
          authorDisplayName: commentAuthorNameMap.get(rc.author_user_id),
          content: rc.content,
          createdAt: rc.created_at,
        })),
        createdAt: publication.createdAt,
        updatedAt: publication.updatedAt,
      };
    });

    return {
      items,
      limit: input.limit,
      offset: input.offset,
      total,
      hasMore: input.offset + publications.length < total,
    };
  }
}

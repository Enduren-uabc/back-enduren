import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ProfilePublicationItem,
  ProfilePublicationPage,
  ProfilePublicationQueryPort,
} from '../../application/ports/profile-publication-query.port';
import { PublicationTypeormEntity } from '../../../publication/infrastructure/persistence/typeorm/entities/publication-typeorm.entity';

interface BuildPublicationItemParams {
  publication: PublicationTypeormEntity;
  authorProfile:
    | { display_name: string; avatar_url: string | null }
    | undefined;
  reactionCounts: Map<string, number>;
  recentReactors: Map<string, string[]>;
  reactorNameMap: Map<string, string>;
  reactedPublicationIds: Set<string>;
  commentCounts: Map<string, number>;
  recentCommentMap: Map<
    string,
    {
      id: string;
      publication_id: string;
      author_user_id: string;
      content: string;
      created_at: Date;
    }[]
  >;
  commentAuthorNameMap: Map<string, string>;
}

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

    const publicationIds = publications.map((p) => p.id);

    const authorProfile = await this.loadAuthorProfile(input.authorUserId);
    const reactionCounts = await this.loadReactionCounts(publicationIds);
    const { recentReactors, reactorNameMap } =
      await this.loadRecentReactors(publicationIds);
    const reactedPublicationIds = await this.loadCurrentUserReactions(
      publicationIds,
      input.currentUserId,
    );
    const commentCounts = await this.loadCommentCounts(publicationIds);
    const { recentCommentMap, commentAuthorNameMap } =
      await this.loadRecentComments(publicationIds);

    const items: ProfilePublicationItem[] = publications.map((publication) =>
      this.buildPublicationItem({
        publication,
        authorProfile,
        reactionCounts,
        recentReactors,
        reactorNameMap,
        reactedPublicationIds,
        commentCounts,
        recentCommentMap,
        commentAuthorNameMap,
      }),
    );

    return {
      items,
      limit: input.limit,
      offset: input.offset,
      total,
      hasMore: input.offset + publications.length < total,
    };
  }

  private async loadAuthorProfile(
    authorUserId: string,
  ): Promise<{ display_name: string; avatar_url: string | null } | undefined> {
    const rows: { display_name: string; avatar_url: string | null }[] =
      await this.dataSource.query(
        `SELECT display_name, avatar_url FROM social_profiles WHERE user_id = $1`,
        [authorUserId],
      );
    return rows[0];
  }

  private async loadReactionCounts(
    publicationIds: string[],
  ): Promise<Map<string, number>> {
    if (publicationIds.length === 0) return new Map();
    const countRows: { publicationid: string; count: string }[] =
      await this.dataSource.query(
        `SELECT r.publication_id AS publicationid, COUNT(*)::text as count
         FROM publication_reactions r
         WHERE r.publication_id = ANY($1)
         GROUP BY r.publication_id`,
        [publicationIds],
      );
    return new Map(
      countRows.map((r) => [r.publicationid, parseInt(r.count, 10)]),
    );
  }

  private async loadRecentReactors(publicationIds: string[]): Promise<{
    recentReactors: Map<string, string[]>;
    reactorNameMap: Map<string, string>;
  }> {
    if (publicationIds.length === 0)
      return { recentReactors: new Map(), reactorNameMap: new Map() };

    const reactorRows: { publicationid: string; authoruserid: string }[] =
      await this.dataSource.query(
        `SELECT r.publication_id AS publicationid, r.author_user_id AS authoruserid
         FROM publication_reactions r
         WHERE r.publication_id = ANY($1)
         ORDER BY r.created_at DESC`,
        [publicationIds],
      );

    const recentReactors = this.collectRecentReactors(reactorRows);

    const allReactorIds = [...new Set([...recentReactors.values()].flat())];
    const userRows: { id: string; username: string }[] =
      allReactorIds.length > 0
        ? await this.dataSource.query(
            `SELECT u.id, u.username FROM users u WHERE u.id = ANY($1)`,
            [allReactorIds],
          )
        : [];
    const reactorNameMap = new Map(userRows.map((u) => [u.id, u.username]));

    return { recentReactors, reactorNameMap };
  }

  private collectRecentReactors(
    reactorRows: { publicationid: string; authoruserid: string }[],
  ): Map<string, string[]> {
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
    return recentReactors;
  }

  private async loadCurrentUserReactions(
    publicationIds: string[],
    currentUserId?: string,
  ): Promise<Set<string>> {
    if (!currentUserId || publicationIds.length === 0) return new Set();
    const rows: { publication_id: string }[] = await this.dataSource.query(
      `SELECT r.publication_id
       FROM publication_reactions r
       WHERE r.publication_id = ANY($1) AND r.author_user_id = $2`,
      [publicationIds, currentUserId],
    );
    return new Set(rows.map((r) => r.publication_id));
  }

  private async loadCommentCounts(
    publicationIds: string[],
  ): Promise<Map<string, number>> {
    if (publicationIds.length === 0) return new Map();
    const countRows: { publicationid: string; count: string }[] =
      await this.dataSource.query(
        `SELECT c.publication_id AS publicationid, COUNT(*)::text as count
         FROM publication_comments c
         WHERE c.publication_id = ANY($1)
         GROUP BY c.publication_id`,
        [publicationIds],
      );
    return new Map(
      countRows.map((r) => [r.publicationid, parseInt(r.count, 10)]),
    );
  }

  private async loadRecentComments(publicationIds: string[]): Promise<{
    recentCommentMap: Map<
      string,
      {
        id: string;
        publication_id: string;
        author_user_id: string;
        content: string;
        created_at: Date;
      }[]
    >;
    commentAuthorNameMap: Map<string, string>;
  }> {
    if (publicationIds.length === 0) {
      return { recentCommentMap: new Map(), commentAuthorNameMap: new Map() };
    }

    const commentRows: {
      id: string;
      publication_id: string;
      author_user_id: string;
      content: string;
      created_at: Date;
    }[] = await this.dataSource.query(
      `SELECT c.id, c.publication_id, c.author_user_id, c.content, c.created_at
       FROM publication_comments c
       WHERE c.publication_id = ANY($1)
       ORDER BY c.created_at DESC`,
      [publicationIds],
    );

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

    return { recentCommentMap, commentAuthorNameMap };
  }

  private buildPublicationItem(params: BuildPublicationItemParams): ProfilePublicationItem {
    const rawComments = params.recentCommentMap.get(params.publication.id) ?? [];
    return {
      id: params.publication.id,
      authorUserId: params.publication.authorUserId,
      authorDisplayName: params.authorProfile?.display_name,
      authorAvatarUrl: params.authorProfile?.avatar_url ?? undefined,
      title: params.publication.title,
      content: params.publication.content,
      mediaUrls: params.publication.mediaUrls ?? [],
      workoutSessionId: params.publication.workoutSessionId,
      exerciseSummary: params.publication.exerciseSummary,
      reactionCount: params.reactionCounts.get(params.publication.id) ?? 0,
      recentReactorNames: (params.recentReactors.get(params.publication.id) ?? []).map(
        (uid) => params.reactorNameMap.get(uid) ?? 'Usuario',
      ),
      likedByMe: params.reactedPublicationIds.has(params.publication.id),
      commentCount: params.commentCounts.get(params.publication.id) ?? 0,
      recentComments: rawComments.map((rc) => ({
        id: rc.id,
        publicationId: rc.publication_id,
        authorUserId: rc.author_user_id,
        authorDisplayName: params.commentAuthorNameMap.get(rc.author_user_id),
        content: rc.content,
        createdAt: rc.created_at,
      })),
      createdAt: params.publication.createdAt,
      updatedAt: params.publication.updatedAt,
    };
  }
}

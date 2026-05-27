import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
import { PublicationMediaRepository } from '../../../domain/repositories/publication-media.repository';
import { PublicationReactionRepository } from '../../../domain/repositories/publication-reaction.repository';
import { AuthorProfileQueryPort } from '../../ports/author-profile-query.port';
import { ListPublicationsDto } from '../../dto/list-publications.dto';
import { PublicationDto } from '../../dto/publication.dto';
import { PublicationApplicationMapper } from '../../mappers/publication.mapper';
import { FollowedUsersQueryPort } from '../../ports/followed-users-query.port';
import { CurrentActor } from '../../ports/current-actor.port';

export const DEFAULT_PUBLICATION_FEED_LIMIT = 20;
export const MAX_PUBLICATION_FEED_LIMIT = 50;
export const PUBLICATION_FOLLOWED_USERS_QUERY_PORT = Symbol(
  'PUBLICATION_FOLLOWED_USERS_QUERY_PORT',
);
export const PUBLICATION_REACTION_REPOSITORY_PORT = Symbol(
  'PUBLICATION_REACTION_REPOSITORY_PORT',
);

export interface ListPublicationsOutput {
  items: PublicationDto[];
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export class ListPublicationsUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly publicationMediaRepository?: PublicationMediaRepository,
    private readonly followedUsersQuery?: FollowedUsersQueryPort,
    private readonly authorProfileQuery?: AuthorProfileQueryPort,
    private readonly reactionRepository?: PublicationReactionRepository,
  ) {}

  public async execute(
    actor: CurrentActor,
    input: ListPublicationsDto,
  ): Promise<ListPublicationsOutput> {
    const limit = input.limit ?? DEFAULT_PUBLICATION_FEED_LIMIT;
    const offset = input.offset ?? 0;
    const filter = input.filter ?? 'all';

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_PUBLICATION_FEED_LIMIT ||
      !Number.isInteger(offset) ||
      offset < 0
    ) {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_FEED_PAGINATION_INVALID,
        'Publication feed pagination is invalid',
        { limit, offset },
      );
    }

    if (filter !== 'all' && filter !== 'following') {
      throw new PublicationDomainError(
        PublicationErrorCode.PUBLICATION_FEED_FILTER_INVALID,
        'Publication feed filter is invalid',
        { filter },
      );
    }

    let publications: any[] = [];
    let total = 0;

    if (filter === 'following') {
      const followedUserIds =
        (await this.followedUsersQuery?.findFollowedUserIds(actor.userId)) ??
        [];

      // Include self in following feed
      const authorUserIds = [...new Set([...followedUserIds, actor.userId])];

      const [pubs, tot] = await Promise.all([
        this.publicationRepository.findFeedByAuthorUserIds({
          authorUserIds,
          limit,
          offset,
        }),
        this.publicationRepository.countFeedByAuthorUserIds(authorUserIds),
      ]);
      publications = pubs;
      total = tot;
    } else {
      const [pubs, tot] = await Promise.all([
        this.publicationRepository.findFeed({ limit, offset }),
        this.publicationRepository.countFeed(),
      ]);
      publications = pubs;
      total = tot;
    }

    // Enrich with author info
    const authorIds = [...new Set(publications.map((p) => p.authorUserId))];
    const profiles =
      (await this.authorProfileQuery?.ensureProfilesExist(authorIds)) ?? [];
    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    // Batch load media for all publications
    const publicationIds = publications.map((p) => p.id);
    const mediaEntries = this.publicationMediaRepository
      ? await Promise.all(
          publicationIds.map((id) =>
            this.publicationMediaRepository!.findByPublicationId(id),
          ),
        )
      : [];
    const mediaMap = new Map<string, PublicationDto['media']>();
    publicationIds.forEach((id, i) => {
      const media = (mediaEntries[i] ?? []).map((m) => ({
        id: m.id,
        url: m.url,
        fileName: m.fileName,
        fileSize: m.fileSize,
        mimeType: m.mimeType,
        sortOrder: m.sortOrder,
        createdAt: m.createdAt.toISOString(),
      }));
      mediaMap.set(id, media);
    });

    // Batch load reaction counts and recent reactors
    const [reactionCounts, recentReactorUserIdsMap] = await Promise.all([
      this.reactionRepository?.countByPublicationIds(publicationIds) ??
        Promise.resolve(new Map<string, number>()),
      this.reactionRepository?.findRecentAuthorUserIdsByPublicationIds(
        publicationIds,
        3,
      ) ?? Promise.resolve(new Map<string, string[]>()),
    ]);

    // Resolve display names for recent reactors
    const allReactorIds = [
      ...new Set([...recentReactorUserIdsMap.values()].flat()),
    ];
    const reactorProfiles =
      (await this.authorProfileQuery?.ensureProfilesExist(allReactorIds)) ?? [];
    const reactorNameMap = new Map(
      reactorProfiles.map((p) => [p.userId, p.displayName]),
    );

    return {
      items: publications.map((publication) => {
        const dto = PublicationApplicationMapper.toDto(
          publication,
          mediaMap.get(publication.id) ?? [],
          reactionCounts.get(publication.id) ?? 0,
          (recentReactorUserIdsMap.get(publication.id) ?? []).map(
            (uid) => reactorNameMap.get(uid) ?? 'Usuario',
          ),
        );
        const profile = profileMap.get(publication.authorUserId);
        if (profile) {
          dto.authorDisplayName = profile.displayName;
          dto.authorAvatarUrl = profile.avatarUrl ?? undefined;
        }
        return dto;
      }),
      limit,
      offset,
      total,
      hasMore: offset + publications.length < total,
    };
  }
}

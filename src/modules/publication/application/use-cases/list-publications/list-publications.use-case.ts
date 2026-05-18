import {
  PublicationDomainError,
  PublicationErrorCode,
} from '../../../domain/errors/publication-domain.error';
import { PublicationRepository } from '../../../domain/repositories/publication.repository';
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
    private readonly followedUsersQuery?: FollowedUsersQueryPort,
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

    if (filter === 'following') {
      const followedUserIds =
        await this.followedUsersQuery?.findFollowedUserIds(actor.userId);

      if (!followedUserIds || followedUserIds.length === 0) {
        return { items: [], limit, offset, total: 0, hasMore: false };
      }

      const [publications, total] = await Promise.all([
        this.publicationRepository.findFeedByAuthorUserIds({
          authorUserIds: followedUserIds,
          limit,
          offset,
        }),
        this.publicationRepository.countFeedByAuthorUserIds(followedUserIds),
      ]);

      return {
        items: publications.map((publication) =>
          PublicationApplicationMapper.toDto(publication),
        ),
        limit,
        offset,
        total,
        hasMore: offset + publications.length < total,
      };
    }

    const [publications, total] = await Promise.all([
      this.publicationRepository.findFeed({ limit, offset }),
      this.publicationRepository.countFeed(),
    ]);

    return {
      items: publications.map((publication) =>
        PublicationApplicationMapper.toDto(publication),
      ),
      limit,
      offset,
      total,
      hasMore: offset + publications.length < total,
    };
  }
}

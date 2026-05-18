import { PublicationDto } from '../../../application/dto/publication.dto';

export class PublicationResponseDto {
  id!: string;
  authorUserId!: string;
  title!: string;
  content!: string;
  mediaUrls!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class ListPublicationsResponseDto {
  items!: PublicationResponseDto[];
  limit!: number;
  offset!: number;
  total!: number;
  hasMore!: boolean;
}

export class DeletePublicationResponseDto {
  id!: string;
  deleted!: boolean;
}

export class PublicationPresenter {
  public static toHttp(publication: PublicationDto): PublicationResponseDto {
    const response = new PublicationResponseDto();
    response.id = publication.id;
    response.authorUserId = publication.authorUserId;
    response.title = publication.title;
    response.content = publication.content;
    response.mediaUrls = publication.mediaUrls;
    response.createdAt = publication.createdAt;
    response.updatedAt = publication.updatedAt;
    return response;
  }

  public static toFeedHttp(input: {
    items: PublicationDto[];
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  }): ListPublicationsResponseDto {
    const response = new ListPublicationsResponseDto();
    response.items = input.items.map((publication) =>
      PublicationPresenter.toHttp(publication),
    );
    response.limit = input.limit;
    response.offset = input.offset;
    response.total = input.total;
    response.hasMore = input.hasMore;
    return response;
  }
}

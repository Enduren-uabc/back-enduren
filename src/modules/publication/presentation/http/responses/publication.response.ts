import {
  PublicationDto,
  ExerciseSummaryDto,
  PublicationMediaDto,
} from '../../../application/dto/publication.dto';

export class PublicationResponseDto {
  id!: string;
  authorUserId!: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  title!: string;
  content!: string;
  mediaUrls!: string[];
  media!: PublicationMediaDto[];
  workoutSessionId!: string | null;
  exerciseSummary!: ExerciseSummaryDto | null;
  reactionCount!: number;
  recentReactorNames!: string[];
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
    response.authorDisplayName = publication.authorDisplayName;
    response.authorAvatarUrl = publication.authorAvatarUrl;
    response.title = publication.title;
    response.content = publication.content;
    response.mediaUrls = publication.mediaUrls;
    response.media = publication.media;
    response.workoutSessionId = publication.workoutSessionId;
    response.exerciseSummary = publication.exerciseSummary;
    response.reactionCount = publication.reactionCount;
    response.recentReactorNames = publication.recentReactorNames;
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

export class CreateWorkoutPublicationResponseDto {
  id!: string;
  authorUserId!: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  title!: string;
  content!: string;
  mediaUrls!: string[];
  media!: PublicationMediaDto[];
  workoutSessionId!: string;
  exerciseSummary!: ExerciseSummaryDto;
  reactionCount!: number;
  recentReactorNames!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class WorkoutPublicationPresenter {
  public static toHttp(
    publication: PublicationDto,
  ): CreateWorkoutPublicationResponseDto {
    const response = new CreateWorkoutPublicationResponseDto();
    response.id = publication.id;
    response.authorUserId = publication.authorUserId;
    response.authorDisplayName = publication.authorDisplayName;
    response.authorAvatarUrl = publication.authorAvatarUrl;
    response.title = publication.title;
    response.content = publication.content;
    response.mediaUrls = publication.mediaUrls;
    response.media = publication.media;
    response.workoutSessionId = publication.workoutSessionId!;
    response.exerciseSummary = publication.exerciseSummary!;
    response.reactionCount = publication.reactionCount;
    response.recentReactorNames = publication.recentReactorNames;
    response.createdAt = publication.createdAt;
    response.updatedAt = publication.updatedAt;
    return response;
  }
}

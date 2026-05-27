import {
  ProfileDto,
  PublicProfileDto,
} from '../../../application/dto/profile.dto';
import { ProfilePublicationPage } from '../../../application/ports/profile-publication-query.port';

export class ProfileResponseDto {
  userId!: string;
  displayName!: string;
  handle!: string;
  bio!: string | null;
  avatarUrl!: string | null;
}

export class PublicProfileResponseDto extends ProfileResponseDto {
  followersCount!: number;
  followingCount!: number;
}

export class FollowProfileResponseDto {
  followerUserId!: string;
  followedUserId!: string;
  following!: boolean;
}

export class ListProfilesResponseDto {
  items!: ProfileResponseDto[];
}

export class ProfilePublicationResponseDto {
  id!: string;
  authorUserId!: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  title!: string;
  content!: string;
  mediaUrls!: string[];
  media?: {
    id: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    sortOrder: number;
    createdAt: string;
  }[];
  workoutSessionId?: string | null;
  exerciseSummary?: Record<string, unknown> | null;
  reactionCount!: number;
  recentReactorNames!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class ListProfilePublicationsResponseDto {
  items!: ProfilePublicationResponseDto[];
  limit!: number;
  offset!: number;
  total!: number;
  hasMore!: boolean;
}

export class ProfilePresenter {
  public static toHttp(profile: ProfileDto): ProfileResponseDto {
    const response = new ProfileResponseDto();
    response.userId = profile.userId;
    response.displayName = profile.displayName;
    response.handle = profile.handle;
    response.bio = profile.bio;
    response.avatarUrl = profile.avatarUrl;
    return response;
  }

  public static publicToHttp(
    profile: PublicProfileDto,
  ): PublicProfileResponseDto {
    const response = new PublicProfileResponseDto();
    response.userId = profile.userId;
    response.displayName = profile.displayName;
    response.handle = profile.handle;
    response.bio = profile.bio;
    response.avatarUrl = profile.avatarUrl;
    response.followersCount = profile.followersCount;
    response.followingCount = profile.followingCount;
    return response;
  }

  public static listToHttp(profiles: ProfileDto[]): ListProfilesResponseDto {
    const response = new ListProfilesResponseDto();
    response.items = profiles.map((profile) =>
      ProfilePresenter.toHttp(profile),
    );
    return response;
  }

  public static publicationsToHttp(
    page: ProfilePublicationPage,
  ): ListProfilePublicationsResponseDto {
    const response = new ListProfilePublicationsResponseDto();
    response.items = page.items.map((publication) => ({
      id: publication.id,
      authorUserId: publication.authorUserId,
      authorDisplayName: publication.authorDisplayName,
      authorAvatarUrl: publication.authorAvatarUrl,
      title: publication.title,
      content: publication.content,
      mediaUrls: publication.mediaUrls,
      media: publication.media,
      workoutSessionId: publication.workoutSessionId,
      exerciseSummary: publication.exerciseSummary,
      reactionCount: publication.reactionCount,
      recentReactorNames: publication.recentReactorNames,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    }));
    response.limit = page.limit;
    response.offset = page.offset;
    response.total = page.total;
    response.hasMore = page.hasMore;
    return response;
  }
}

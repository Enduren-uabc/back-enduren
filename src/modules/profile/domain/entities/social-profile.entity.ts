import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../errors/profile-domain.error';
import { ProfileAvatarUrl } from '../value-objects/profile-avatar-url.value-object';

export const MAX_PROFILE_BIO_LENGTH = 300;

export class SocialProfile {
  public readonly userId: string;
  public readonly displayName: string;
  public readonly handle: string;
  public readonly bio: string | null;
  public readonly avatarUrl: ProfileAvatarUrl;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(
    userId: string,
    displayName: string,
    handle: string,
    bio: string | null,
    avatarUrl: ProfileAvatarUrl,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.userId = userId;
    this.displayName = displayName;
    this.handle = handle;
    this.bio = bio;
    this.avatarUrl = avatarUrl;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static create(
    userId: string,
    displayName: string,
    handle: string,
    bio: string | null = null,
    avatarUrl: ProfileAvatarUrl = ProfileAvatarUrl.create(null),
  ): SocialProfile {
    const normalizedDisplayName = displayName?.trim() ?? '';
    const normalizedHandle = handle?.trim() ?? '';

    if (normalizedDisplayName.length === 0) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_DISPLAY_NAME_REQUIRED,
        'Profile display name is required',
        { displayName },
      );
    }

    if (normalizedHandle.length === 0) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_HANDLE_REQUIRED,
        'Profile handle is required',
        { handle },
      );
    }

    const normalizedBio = SocialProfile.normalizeBio(bio);

    const now = new Date();
    return new SocialProfile(
      userId,
      normalizedDisplayName,
      normalizedHandle,
      normalizedBio,
      avatarUrl,
      now,
      now,
    );
  }

  public static reconstitute(
    userId: string,
    displayName: string,
    handle: string,
    bio: string | null,
    avatarUrl: ProfileAvatarUrl,
    createdAt: Date,
    updatedAt: Date,
  ): SocialProfile {
    return new SocialProfile(
      userId,
      displayName,
      handle,
      bio,
      avatarUrl,
      createdAt,
      updatedAt,
    );
  }

  public updateOwn(input: {
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: ProfileAvatarUrl;
  }): SocialProfile {
    if (
      input.displayName === undefined &&
      input.bio === undefined &&
      input.avatarUrl === undefined
    ) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_UPDATE_EMPTY,
        'At least one profile field must be provided',
        { userId: this.userId },
      );
    }

    return new SocialProfile(
      this.userId,
      input.displayName !== undefined && input.displayName !== null
        ? input.displayName.trim()
        : this.displayName,
      this.handle,
      input.bio !== undefined
        ? SocialProfile.normalizeBio(input.bio)
        : this.bio,
      input.avatarUrl ?? this.avatarUrl,
      this.createdAt,
      new Date(),
    );
  }

  private static normalizeBio(value: string | null): string | null {
    const normalized = value?.trim() || null;

    if (normalized !== null && normalized.length > MAX_PROFILE_BIO_LENGTH) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_BIO_TOO_LONG,
        `Profile bio cannot exceed ${MAX_PROFILE_BIO_LENGTH} characters`,
        { maxLength: MAX_PROFILE_BIO_LENGTH },
      );
    }

    return normalized;
  }
}

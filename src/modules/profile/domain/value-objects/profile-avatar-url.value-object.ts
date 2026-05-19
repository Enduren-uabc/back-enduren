import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../errors/profile-domain.error';

export class ProfileAvatarUrl {
  public readonly value: string | null;

  private constructor(value: string | null) {
    this.value = value;
  }

  public static create(value?: string | null): ProfileAvatarUrl {
    const normalized = value?.trim() || null;

    if (normalized !== null && !ProfileAvatarUrl.isValidUrl(normalized)) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_AVATAR_URL_INVALID,
        'Profile avatar URL is invalid',
        { avatarUrl: value },
      );
    }

    return new ProfileAvatarUrl(normalized);
  }

  public static reconstitute(value: string | null): ProfileAvatarUrl {
    return new ProfileAvatarUrl(value);
  }

  private static isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

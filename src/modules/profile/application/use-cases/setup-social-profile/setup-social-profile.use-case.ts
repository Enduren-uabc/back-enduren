import { Inject, Injectable } from '@nestjs/common';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { SOCIAL_PROFILE_REPOSITORY_PORT } from '../follow-profile/follow-profile.use-case';
import { SocialProfile } from '../../../domain/entities/social-profile.entity';
import { ProfileAvatarUrl } from '../../../domain/value-objects/profile-avatar-url.value-object';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';

export interface SetupSocialProfileInput {
  userId: string;
  displayName: string;
  bio?: string;
  avatarFile?: Express.Multer.File;
}

@Injectable()
export class SetupSocialProfileUseCase {
  constructor(
    @Inject(SOCIAL_PROFILE_REPOSITORY_PORT)
    private readonly profileRepository: SocialProfileRepository,
    private readonly storageService: StorageService,
  ) {}

  async execute(input: SetupSocialProfileInput): Promise<SocialProfile> {
    let profile = await this.profileRepository.findByUserId(input.userId);

    if (!profile) {
      profile = SocialProfile.create(
        input.userId,
        input.displayName,
        `@${input.displayName}`,
        input.bio ?? null,
      );
    } else {
      profile = profile.updateOwn({
        displayName: input.displayName,
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
      });
    }

    if (input.avatarFile) {
      const uploadOutput = await this.storageService.uploadFile(
        input.userId,
        'avatar',
        input.avatarFile,
      );

      const signedUrl = await this.storageService.getSignedUrl(
        uploadOutput.containerName,
        uploadOutput.blobPath,
        315360000,
      );

      const avatarUrl = ProfileAvatarUrl.create(signedUrl);
      profile = profile.updateOwn({ avatarUrl });
    }

    return this.profileRepository.save(profile);
  }
}

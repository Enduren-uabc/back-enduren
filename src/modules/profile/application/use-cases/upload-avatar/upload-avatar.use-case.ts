import { Inject, Injectable } from '@nestjs/common';
import { StorageService } from '../../../../../shared/storage/domain/services/storage.service';
import { ProfileAvatarUrl } from '../../../domain/value-objects/profile-avatar-url.value-object';
import { SocialProfileRepository } from '../../../domain/repositories/social-profile.repository';
import { ProfileApplicationMapper } from '../../mappers/profile.mapper';
import { ProfileDto } from '../../dto/profile.dto';
import { CurrentActor } from '../../ports/current-actor.port';
import { SOCIAL_PROFILE_REPOSITORY_PORT } from '../../use-cases/follow-profile/follow-profile.use-case';
import {
  ProfileDomainError,
  ProfileErrorCode,
} from '../../../domain/errors/profile-domain.error';

export interface UploadAvatarInput {
  actor: CurrentActor;
  file: Express.Multer.File;
}

@Injectable()
export class UploadAvatarUseCase {
  constructor(
    private readonly storageService: StorageService,
    @Inject(SOCIAL_PROFILE_REPOSITORY_PORT)
    private readonly profileRepository: SocialProfileRepository,
  ) {}

  async execute(input: UploadAvatarInput): Promise<ProfileDto> {
    const profile = await this.profileRepository.findByUserId(
      input.actor.userId,
    );
    if (!profile) {
      throw new ProfileDomainError(
        ProfileErrorCode.PROFILE_NOT_FOUND,
        'Profile not found',
        { userId: input.actor.userId },
      );
    }

    const uploadOutput = await this.storageService.uploadFile(
      input.actor.userId,
      'avatar',
      input.file,
    );

    const signedUrl = await this.storageService.getSignedUrl(
      uploadOutput.containerName,
      uploadOutput.blobPath,
      315360000, // 10 years
    );

    const avatarUrl = ProfileAvatarUrl.create(signedUrl);
    const updated = profile.updateOwn({ avatarUrl });
    const saved = await this.profileRepository.save(updated);

    return ProfileApplicationMapper.toDto(saved);
  }
}

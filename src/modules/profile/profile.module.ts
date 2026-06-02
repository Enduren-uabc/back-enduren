import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../shared/storage/storage.module';
import { UsersModule } from '../users/users.module';
import { CheckOnboardingStatusUseCase } from './application/use-cases/check-onboarding-status/check-onboarding-status.use-case';
import { CreateOrUpdateProfileUseCase } from './application/use-cases/create-or-update-profile/create-or-update-profile.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile/get-profile.use-case';
import { UploadAvatarUseCase } from './application/use-cases/upload-avatar/upload-avatar.use-case';
import { SetupSocialProfileUseCase } from './application/use-cases/setup-social-profile/setup-social-profile.use-case';
import { PROFILE_REPOSITORY_PORT } from './domain/repositories/profile.repository';
import { ProfileAvatarStorageStrategy } from './infrastructure/storage/profile-avatar-storage.strategy';
import { ProfileTypeormEntity } from './infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { ProfileInfrastructureModule } from './infrastructure/providers/profile-infrastructure.module';
import { profileRepositoryProvider } from './infrastructure/providers/profile-repository.provider';
import { ProfileController } from './presentation/http/controllers/profile.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileTypeormEntity]),
    ProfileInfrastructureModule,
    StorageModule.forFeature(ProfileAvatarStorageStrategy),
    UsersModule,
  ],
  providers: [
    profileRepositoryProvider,
    CreateOrUpdateProfileUseCase,
    GetProfileUseCase,
    CheckOnboardingStatusUseCase,
    UploadAvatarUseCase,
    SetupSocialProfileUseCase,
  ],
  controllers: [ProfileController],
  exports: [PROFILE_REPOSITORY_PORT, ProfileInfrastructureModule],
})
export class ProfileModule {}

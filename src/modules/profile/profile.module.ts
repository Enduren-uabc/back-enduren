import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckOnboardingStatusUseCase } from './application/use-cases/check-onboarding-status/check-onboarding-status.use-case';
import { CreateOrUpdateProfileUseCase } from './application/use-cases/create-or-update-profile/create-or-update-profile.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile/get-profile.use-case';
import { PROFILE_REPOSITORY_PORT } from './domain/repositories/profile.repository';
import { ProfileTypeormEntity } from './infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { ProfileInfrastructureModule } from './infrastructure/providers/profile-infrastructure.module';
import { profileRepositoryProvider } from './infrastructure/providers/profile-repository.provider';
import { ProfileController } from './presentation/http/controllers/profile.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileTypeormEntity]),
    ProfileInfrastructureModule,
  ],
  providers: [
    profileRepositoryProvider,
    CreateOrUpdateProfileUseCase,
    GetProfileUseCase,
    CheckOnboardingStatusUseCase,
  ],
  controllers: [ProfileController],
  exports: [PROFILE_REPOSITORY_PORT],
})
export class ProfileModule {}

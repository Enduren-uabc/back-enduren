import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileTypeormEntity } from './infrastructure/persistence/typeorm/entities/profile-typeorm.entity';
import { TypeormProfileRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-profile.repository';
import { PROFILE_REPOSITORY_PORT } from './domain/repositories/profile.repository';
import { CreateOrUpdateProfileUseCase } from './application/use-cases/create-or-update-profile/create-or-update-profile.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile/get-profile.use-case';
import { CheckOnboardingStatusUseCase } from './application/use-cases/check-onboarding-status/check-onboarding-status.use-case';
import { ProfileController } from './presentation/http/controllers/profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileTypeormEntity])],
  providers: [
    {
      provide: PROFILE_REPOSITORY_PORT,
      useClass: TypeormProfileRepository,
    },
    CreateOrUpdateProfileUseCase,
    GetProfileUseCase,
    CheckOnboardingStatusUseCase,
  ],
  controllers: [ProfileController],
  exports: [PROFILE_REPOSITORY_PORT],
})
export class ProfileModule {}

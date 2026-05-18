import { Module } from '@nestjs/common';
import { ProfileInfrastructureModule } from './infrastructure/providers/profile-infrastructure.module';
import { ProfilePresentationModule } from './presentation/http/profile-presentation.module';

@Module({
  imports: [ProfileInfrastructureModule, ProfilePresentationModule],
})
export class ProfileModule {}

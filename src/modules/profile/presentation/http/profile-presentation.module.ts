import { Module } from '@nestjs/common';
import { ProfileInfrastructureModule } from '../../infrastructure/providers/profile-infrastructure.module';
import { ProfileController } from './controllers/profile.controller';

@Module({
  imports: [ProfileInfrastructureModule],
  controllers: [ProfileController],
})
export class ProfilePresentationModule {}

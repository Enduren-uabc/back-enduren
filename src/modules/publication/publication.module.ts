import { Module } from '@nestjs/common';
import { PublicationInfrastructureModule } from './infrastructure/providers/publication-infrastructure.module';
import { PublicationPresentationModule } from './presentation/http/publication-presentation.module';

@Module({
  imports: [PublicationInfrastructureModule, PublicationPresentationModule],
})
export class PublicationModule {}

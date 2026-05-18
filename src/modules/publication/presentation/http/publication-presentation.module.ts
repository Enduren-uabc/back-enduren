import { Module } from '@nestjs/common';
import { PublicationInfrastructureModule } from '../../infrastructure/providers/publication-infrastructure.module';
import { PublicationCommentController } from './controllers/publication-comment.controller';
import { PublicationController } from './controllers/publication.controller';

@Module({
  imports: [PublicationInfrastructureModule],
  controllers: [PublicationController, PublicationCommentController],
})
export class PublicationPresentationModule {}

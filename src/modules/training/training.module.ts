import { Module } from '@nestjs/common';
import { TrainingInfrastructureModule } from './infrastructure/providers/training-infrastructure.module';
import { TrainingPresentationModule } from './presentation/http/training-presentation.module';

@Module({
  imports: [TrainingInfrastructureModule, TrainingPresentationModule],
  exports: [TrainingInfrastructureModule],
})
export class TrainingModule {}

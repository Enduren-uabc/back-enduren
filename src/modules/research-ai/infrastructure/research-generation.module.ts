// Created by: Codex (AI-assisted), 2026-10-20
import { DynamicModule, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GenerationWorkflow } from '../application/generation-workflow';
import {
  OpenAIResponsesGateway,
  OpenAIGatewayOptions,
} from './openai/openai-responses-gateway';
import { PostgresRunStore } from './persistence/postgres-run-store';
import { PostgresGenerationExecutionStore } from './persistence/postgres-generation-execution-store';

/** Explicit composition only; does not run migrations or create authorizations. */
@Module({})
export class ResearchGenerationModule {
  static register(options: OpenAIGatewayOptions = {}): DynamicModule {
    return {
      module: ResearchGenerationModule,
      providers: [
        {
          provide: GenerationWorkflow,
          inject: [DataSource],
          useFactory: (source: DataSource) =>
            new GenerationWorkflow(
              new PostgresRunStore(source),
              new PostgresGenerationExecutionStore(source),
              new OpenAIResponsesGateway(options),
            ),
        },
      ],
      exports: [GenerationWorkflow],
    };
  }
}

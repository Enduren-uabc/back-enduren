// Created by: Codex (AI-assisted), 2026-10-18
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RESEARCH_RUN_STORE } from '../../application/run-persistence.port';
import { PostgresRunStore } from './postgres-run-store';
import { RESEARCH_ENTITIES } from './research-records';

/** Opt-in composition only; migration application and authorization remain explicit deployment decisions. */
@Module({
  imports: [TypeOrmModule.forFeature(RESEARCH_ENTITIES)],
  providers: [
    {
      provide: RESEARCH_RUN_STORE,
      inject: [DataSource],
      useFactory: (source: DataSource) => new PostgresRunStore(source),
    },
  ],
  exports: [RESEARCH_RUN_STORE],
})
export class ResearchPersistenceModule {}

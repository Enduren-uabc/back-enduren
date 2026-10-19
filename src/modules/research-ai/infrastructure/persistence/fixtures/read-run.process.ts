// Created by: Codex (AI-assisted), 2026-10-19
import { readFileSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { RESEARCH_ENTITIES } from '../research-records';
import { PostgresRunStore } from '../postgres-run-store';

// Executed only by the real PostgreSQL restart test, in a fresh Node process.
async function readCommittedRun(): Promise<void> {
  const configPath = process.env.RESEARCH_AI_TEST_DB_CONFIG;
  if (!configPath) throw new Error('Isolated test configuration required');
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  if (config.host !== '127.0.0.1' || config.database !== 'rg_das_s1b_test') {
    throw new Error('Refusing database outside isolated test boundary');
  }
  const source = await new DataSource({
    type: 'postgres',
    ...config,
    entities: RESEARCH_ENTITIES,
    synchronize: false,
    logging: false,
  }).initialize();
  try {
    process.stdout.write(
      JSON.stringify(
        await new PostgresRunStore(source).getRun(process.argv[2]),
      ),
    );
  } finally {
    await source.destroy();
  }
}
void readCommittedRun().catch(() => {
  process.stderr.write('Isolated process recovery failed');
  process.exitCode = 1;
});

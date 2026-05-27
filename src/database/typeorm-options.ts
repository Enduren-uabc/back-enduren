import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { join } from 'path';

export type DatabaseEnvironment = {
  DB_USE_AZURE?: string | boolean;
  DB_HOST?: string;
  DB_PORT?: string | number;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_DATABASE?: string;
  DB_SSL?: string | boolean;
  DB_SSL_REJECT_UNAUTHORIZED?: string | boolean;
  DB_MIGRATIONS_RUN?: string | boolean;
  DB_HOST_CLOUD?: string;
  DB_PORT_CLOUD?: string | number;
  DB_USERNAME_CLOUD?: string;
  DB_PASSWORD_CLOUD?: string;
  DB_DATABASE_CLOUD?: string;
  DB_SSL_CLOUD?: string | boolean;
  DB_SSL_REJECT_UNAUTHORIZED_CLOUD?: string | boolean;
  AZURE_DB_HOST?: string;
  AZURE_DB_PORT?: string | number;
  AZURE_DB_USERNAME?: string;
  AZURE_DB_PASSWORD?: string;
  AZURE_DB_DATABASE?: string;
  AZURE_DB_SSL?: string | boolean;
  AZURE_DB_SSL_REJECT_UNAUTHORIZED?: string | boolean;
};

const migrationsGlob = join(__dirname, '..', 'migrations', '*{.ts,.js}');
const entitiesGlob = join(
  __dirname,
  '..',
  'modules',
  '**',
  'infrastructure',
  'persistence',
  'typeorm',
  'entities',
  '*{.ts,.js}',
);

function parseBoolean(
  value: string | boolean | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parsePort(value: string | number | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) ? parsed : 5432;
}

function resolveDatabaseEnvironment(
  env: DatabaseEnvironment,
): DatabaseEnvironment {
  const useAzure = parseBoolean(env.DB_USE_AZURE, false);

  if (!useAzure) {
    return env;
  }

  return {
    ...env,
    DB_HOST: env.AZURE_DB_HOST ?? env.DB_HOST_CLOUD ?? env.DB_HOST,
    DB_PORT: env.AZURE_DB_PORT ?? env.DB_PORT_CLOUD ?? env.DB_PORT,
    DB_USERNAME:
      env.AZURE_DB_USERNAME ?? env.DB_USERNAME_CLOUD ?? env.DB_USERNAME,
    DB_PASSWORD:
      env.AZURE_DB_PASSWORD ?? env.DB_PASSWORD_CLOUD ?? env.DB_PASSWORD,
    DB_DATABASE:
      env.AZURE_DB_DATABASE ?? env.DB_DATABASE_CLOUD ?? env.DB_DATABASE,
    DB_SSL: env.AZURE_DB_SSL ?? env.DB_SSL_CLOUD ?? env.DB_SSL ?? true,
    DB_SSL_REJECT_UNAUTHORIZED:
      env.AZURE_DB_SSL_REJECT_UNAUTHORIZED ??
      env.DB_SSL_REJECT_UNAUTHORIZED_CLOUD ??
      env.DB_SSL_REJECT_UNAUTHORIZED,
  };
}

function buildSslOptions(
  env: DatabaseEnvironment,
): PostgresConnectionOptions['ssl'] {
  if (!parseBoolean(env.DB_SSL, false)) {
    return false;
  }

  if (env.DB_SSL_REJECT_UNAUTHORIZED === undefined) {
    return true;
  }

  return {
    rejectUnauthorized: parseBoolean(env.DB_SSL_REJECT_UNAUTHORIZED, true),
  };
}

function buildBaseOptions(env: DatabaseEnvironment): PostgresConnectionOptions {
  const selectedEnv = resolveDatabaseEnvironment(env);

  return {
    type: 'postgres',
    host: selectedEnv.DB_HOST ?? 'localhost',
    port: parsePort(selectedEnv.DB_PORT),
    username: selectedEnv.DB_USERNAME ?? 'postgres',
    password: selectedEnv.DB_PASSWORD ?? 'postgres',
    database: selectedEnv.DB_DATABASE ?? 'endure',
    synchronize: false,
    migrations: [migrationsGlob],
    migrationsRun: parseBoolean(selectedEnv.DB_MIGRATIONS_RUN, false),
    ssl: buildSslOptions(selectedEnv),
  };
}

export function createTypeOrmModuleOptions(
  env: DatabaseEnvironment,
): TypeOrmModuleOptions {
  return {
    ...buildBaseOptions(env),
    autoLoadEntities: true,
  };
}

export function createTypeOrmDataSourceOptions(
  env: DatabaseEnvironment,
): DataSourceOptions {
  return {
    ...buildBaseOptions(env),
    migrationsRun: false,
    entities: [entitiesGlob],
  };
}

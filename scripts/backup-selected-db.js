#!/usr/bin/env node

const { existsSync, mkdirSync, readFileSync } = require('fs');
const { join, resolve } = require('path');
const { spawnSync } = require('child_process');

function loadLocalEnvFile() {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function selectedValue(key) {
  const useAzure = parseBoolean(process.env.DB_USE_AZURE, false);

  if (!useAzure) {
    return process.env[key];
  }

  return (
    process.env[`AZURE_${key}`] ??
    process.env[`${key}_CLOUD`] ??
    process.env[key]
  );
}

function required(key) {
  const value = selectedValue(key);

  if (!value) {
    throw new Error(`Missing selected database value: ${key}`);
  }

  return value;
}

function backupPath() {
  const explicitPath = process.argv[2];

  if (explicitPath) {
    return explicitPath;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = join(process.cwd(), 'database-backups');

  mkdirSync(directory, { recursive: true });

  return join(directory, `${timestamp}-selected-db.dump`);
}

function main() {
  loadLocalEnvFile();

  const filePath = backupPath();
  const sslEnabled = parseBoolean(
    selectedValue('DB_SSL'),
    parseBoolean(process.env.DB_USE_AZURE, false),
  );
  const env = {
    ...process.env,
    PGPASSWORD: required('DB_PASSWORD'),
    PGSSLMODE: sslEnabled ? 'require' : process.env.PGSSLMODE,
  };
  const result = spawnSync(
    'pg_dump',
    [
      '-Fc',
      '--no-owner',
      '--no-acl',
      '-h',
      required('DB_HOST'),
      '-p',
      selectedValue('DB_PORT') ?? '5432',
      '-U',
      required('DB_USERNAME'),
      '-d',
      required('DB_DATABASE'),
      '-f',
      filePath,
    ],
    {
      env,
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return;
  }

  console.log(`Backup created: ${filePath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

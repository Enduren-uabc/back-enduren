#!/usr/bin/env node

const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { join, resolve } = require('path');
const { Client } = require('pg');

const EXCLUDED_TABLES = new Set([
  'refresh_tokens',
  'email_verification_tokens',
  'password_reset_tokens',
  'social_auth_codes',
  'push_tokens',
  'migrations',
]);

const CRITICAL_COLUMNS = {
  extracted_certificate_data: ['has_veracity_code', 'veracity_code'],
  publications: ['workout_session_id'],
  social_profiles: ['handle'],
  trainer_verifications: ['flow_mode', 'assigned_reviewer_id'],
  users: [
    'email',
    'username',
    'trainer_code',
    'auth_provider',
    'social_id',
    'failed_login_attempts',
    'locked_until',
  ],
};

const MAX_ERROR_SAMPLES = 10;

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

function parsePort(value) {
  const parsed = Number.parseInt(value ?? '', 10);

  return Number.isFinite(parsed) ? parsed : 5432;
}

function parseArgs(argv) {
  const args = {
    command:
      argv.includes('--help') || argv.includes('-h')
        ? 'help'
        : (argv[2] ?? 'help'),
    dryRun: true,
    schema: 'public',
    reportPath: undefined,
  };

  for (let index = 3; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--execute') {
      args.dryRun = false;
      continue;
    }

    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (arg === '--schema') {
      args.schema = argv[index + 1] ?? args.schema;
      index += 1;
      continue;
    }

    if (arg === '--report') {
      args.reportPath = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function readEnv(prefix, key, fallbackToDefaultDbVars) {
  return (
    process.env[`${prefix}_${key}`] ??
    (fallbackToDefaultDbVars ? readSelectedDefaultDbEnv(key) : undefined)
  );
}

function readSelectedDefaultDbEnv(key) {
  const useAzure = parseBoolean(process.env.DB_USE_AZURE, false);

  if (!useAzure) {
    return process.env[key];
  }

  const selectedValue =
    process.env[`AZURE_${key}`] ??
    process.env[`${key}_CLOUD`] ??
    process.env[key];

  if (key === 'DB_SSL' && selectedValue === undefined) {
    return 'true';
  }

  return selectedValue;
}

function buildSslOptions(value, rejectUnauthorizedValue) {
  if (!parseBoolean(value, false)) {
    return undefined;
  }

  if (rejectUnauthorizedValue === undefined) {
    return true;
  }

  return {
    rejectUnauthorized: parseBoolean(rejectUnauthorizedValue, true),
  };
}

function dbConfig(prefix, fallbackToDefaultDbVars = false) {
  return {
    host: readEnv(prefix, 'DB_HOST', fallbackToDefaultDbVars),
    port: parsePort(readEnv(prefix, 'DB_PORT', fallbackToDefaultDbVars)),
    user: readEnv(prefix, 'DB_USERNAME', fallbackToDefaultDbVars),
    password: readEnv(prefix, 'DB_PASSWORD', fallbackToDefaultDbVars),
    database: readEnv(prefix, 'DB_DATABASE', fallbackToDefaultDbVars),
    ssl: buildSslOptions(
      readEnv(prefix, 'DB_SSL', fallbackToDefaultDbVars),
      readEnv(prefix, 'DB_SSL_REJECT_UNAUTHORIZED', fallbackToDefaultDbVars),
    ),
    application_name: `endure-${prefix.toLowerCase()}-migration`,
  };
}

function assertDbConfig(config, label) {
  const missing = ['host', 'user', 'database'].filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `${label} DB config missing required values: ${missing.join(', ')}`,
    );
  }
}

function safeConnectionSummary(config) {
  return {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    ssl: Boolean(config.ssl),
  };
}

function quoteIdent(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function tableIdent(schema, table) {
  return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

async function listTables(client, schema) {
  const result = await client.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `,
    [schema],
  );

  return result.rows.map((row) => row.table_name);
}

async function tableExists(client, schema, table) {
  const result = await client.query(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name = $2
        AND table_type = 'BASE TABLE'
      LIMIT 1
    `,
    [schema, table],
  );

  return result.rowCount > 0;
}

async function getTableColumns(client, schema, table) {
  const result = await client.query(
    `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        is_generated,
        is_identity,
        identity_generation,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2
      ORDER BY ordinal_position
    `,
    [schema, table],
  );

  return result.rows;
}

async function countRows(client, schema, table) {
  const result = await client.query(
    `SELECT COUNT(*)::bigint AS count FROM ${tableIdent(schema, table)}`,
  );

  return Number(result.rows[0].count);
}

async function getExtensions(client) {
  const result = await client.query(`
    SELECT extname, extversion
    FROM pg_extension
    ORDER BY extname
  `);

  return result.rows;
}

async function getConstraintSummary(client, schema) {
  const result = await client.query(
    `
      SELECT table_name, constraint_type, COUNT(*)::int AS count
      FROM information_schema.table_constraints
      WHERE table_schema = $1
      GROUP BY table_name, constraint_type
      ORDER BY table_name, constraint_type
    `,
    [schema],
  );

  return result.rows.filter((row) => !EXCLUDED_TABLES.has(row.table_name));
}

async function getMigrations(client, schema) {
  if (!(await tableExists(client, schema, 'migrations'))) {
    return {
      present: false,
      count: 0,
      latest: null,
    };
  }

  const result = await client.query(
    `
      SELECT timestamp, name
      FROM ${tableIdent(schema, 'migrations')}
      ORDER BY timestamp
    `,
  );

  const latest = result.rows[result.rows.length - 1] ?? null;

  return {
    present: true,
    count: result.rowCount,
    latest,
    rows: result.rows,
  };
}

async function collectAudit(client, label, schema, connection) {
  const tables = await listTables(client, schema);
  const includedTables = tables.filter((table) => !EXCLUDED_TABLES.has(table));
  const counts = {};
  const columnsByTable = {};

  for (const table of includedTables) {
    counts[table] = await countRows(client, schema, table);
    columnsByTable[table] = await getTableColumns(client, schema, table);
  }

  return {
    label,
    connection: safeConnectionSummary(connection),
    tables: {
      total: tables.length,
      included: includedTables.length,
      excludedPresent: tables.filter((table) => EXCLUDED_TABLES.has(table)),
      names: includedTables,
    },
    counts,
    extensions: await getExtensions(client),
    constraintSummary: await getConstraintSummary(client, schema),
    criticalColumns: collectCriticalColumns(columnsByTable),
    migrations: await getMigrations(client, schema),
    columnsByTable,
  };
}

function collectCriticalColumns(columnsByTable) {
  const result = {};

  for (const [table, requiredColumns] of Object.entries(CRITICAL_COLUMNS)) {
    const presentColumns = new Set(
      (columnsByTable[table] ?? []).map((column) => column.column_name),
    );
    const missing = requiredColumns.filter(
      (column) => !presentColumns.has(column),
    );

    result[table] = {
      required: requiredColumns,
      missing,
      allPresent: missing.length === 0,
    };
  }

  return result;
}

function compareSchemas(sourceAudit, targetAudit) {
  const sourceTables = new Set(sourceAudit.tables.names);
  const targetTables = new Set(targetAudit.tables.names);
  const sourceMissingInTarget = [...sourceTables].filter(
    (table) => !targetTables.has(table),
  );
  const targetMissingInSource = [...targetTables].filter(
    (table) => !sourceTables.has(table),
  );
  const sourceColumnsMissingInTarget = [];

  for (const table of sourceTables) {
    if (!targetTables.has(table)) {
      continue;
    }

    const sourceColumns = sourceAudit.columnsByTable[table].map(
      (column) => column.column_name,
    );
    const targetColumns = new Set(
      targetAudit.columnsByTable[table].map((column) => column.column_name),
    );
    const missing = sourceColumns.filter(
      (column) => !targetColumns.has(column),
    );

    if (missing.length > 0) {
      sourceColumnsMissingInTarget.push({ table, missing });
    }
  }

  const missingCriticalColumns = {
    source: Object.entries(sourceAudit.criticalColumns)
      .filter(([, value]) => !value.allPresent)
      .map(([table, value]) => ({ table, missing: value.missing })),
    target: Object.entries(targetAudit.criticalColumns)
      .filter(([, value]) => !value.allPresent)
      .map(([table, value]) => ({ table, missing: value.missing })),
  };

  return {
    sourceMissingInTarget,
    targetMissingInSource,
    sourceColumnsMissingInTarget,
    missingCriticalColumns,
    hasCriticalIssues:
      sourceMissingInTarget.length > 0 ||
      sourceColumnsMissingInTarget.length > 0 ||
      missingCriticalColumns.source.length > 0 ||
      missingCriticalColumns.target.length > 0,
  };
}

async function runAudit(
  sourceClient,
  targetClient,
  args,
  sourceConfig,
  targetConfig,
) {
  const [sourceAudit, targetAudit] = await Promise.all([
    collectAudit(sourceClient, 'source', args.schema, sourceConfig),
    collectAudit(targetClient, 'target', args.schema, targetConfig),
  ]);
  const schemaComparison = compareSchemas(sourceAudit, targetAudit);

  return {
    generatedAt: new Date().toISOString(),
    command: 'audit',
    schema: args.schema,
    excludedTables: [...EXCLUDED_TABLES].sort(),
    source: stripColumnDetails(sourceAudit),
    target: stripColumnDetails(targetAudit),
    schemaComparison,
    hasCriticalIssues: schemaComparison.hasCriticalIssues,
  };
}

function stripColumnDetails(audit) {
  const { columnsByTable, ...safeAudit } = audit;

  return safeAudit;
}

async function getForeignKeyDependencies(client, schema, allowedTables) {
  const allowed = new Set(allowedTables);
  const result = await client.query(
    `
      SELECT DISTINCT
        tc.table_name AS child_table,
        ccu.table_name AS parent_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = $1
        AND ccu.table_schema = $1
    `,
    [schema],
  );
  const dependencies = new Map();

  for (const row of result.rows) {
    if (!allowed.has(row.child_table) || !allowed.has(row.parent_table)) {
      continue;
    }

    if (!dependencies.has(row.child_table)) {
      dependencies.set(row.child_table, new Set());
    }

    dependencies.get(row.child_table).add(row.parent_table);
  }

  return dependencies;
}

function orderTablesByDependencies(tables, dependencies) {
  const remaining = new Set(tables);
  const ordered = [];
  const cycles = [];

  while (remaining.size > 0) {
    let progressed = false;

    for (const table of [...remaining].sort()) {
      const tableDependencies = [...(dependencies.get(table) ?? [])].filter(
        (dependency) => dependency !== table && remaining.has(dependency),
      );

      if (tableDependencies.length > 0) {
        continue;
      }

      ordered.push(table);
      remaining.delete(table);
      progressed = true;
    }

    if (!progressed) {
      cycles.push(...[...remaining].sort());
      ordered.push(...cycles);
      remaining.clear();
    }
  }

  return { ordered, cycles };
}

function insertableColumns(columns) {
  return columns.filter(
    (column) =>
      column.is_generated === 'NEVER' &&
      column.identity_generation !== 'ALWAYS',
  );
}

async function buildMergePlan(sourceClient, targetClient, schema) {
  const sourceTables = await listTables(sourceClient, schema);
  const targetTables = await listTables(targetClient, schema);
  const targetTableSet = new Set(targetTables);
  const tables = sourceTables.filter(
    (table) => !EXCLUDED_TABLES.has(table) && targetTableSet.has(table),
  );
  const sourceMissingInTarget = sourceTables.filter(
    (table) => !EXCLUDED_TABLES.has(table) && !targetTableSet.has(table),
  );
  const dependencies = await getForeignKeyDependencies(
    targetClient,
    schema,
    tables,
  );
  const order = orderTablesByDependencies(tables, dependencies);

  return {
    tables: order.ordered,
    dependencyCycles: order.cycles,
    sourceMissingInTarget,
  };
}

async function mergeTable(sourceClient, targetClient, schema, table, dryRun) {
  const sourceColumns = insertableColumns(
    await getTableColumns(sourceClient, schema, table),
  );
  const targetColumns = new Set(
    (await getTableColumns(targetClient, schema, table)).map(
      (column) => column.column_name,
    ),
  );
  const missingColumns = sourceColumns
    .map((column) => column.column_name)
    .filter((column) => !targetColumns.has(column));

  if (missingColumns.length > 0) {
    return {
      table,
      sourceRows: await countRows(sourceClient, schema, table),
      targetRowsBefore: await countRows(targetClient, schema, table),
      attempted: 0,
      inserted: 0,
      conflicts: 0,
      fkSkipped: 0,
      criticalErrors: [
        {
          code: 'SCHEMA_MISMATCH',
          missingColumns,
        },
      ],
    };
  }

  const columns = sourceColumns.map((column) => column.column_name);
  const sourceRows = await countRows(sourceClient, schema, table);
  const targetRowsBefore = await countRows(targetClient, schema, table);

  if (columns.length === 0) {
    return {
      table,
      sourceRows,
      targetRowsBefore,
      attempted: 0,
      inserted: 0,
      conflicts: 0,
      fkSkipped: 0,
      criticalErrors: [
        {
          code: 'NO_INSERTABLE_COLUMNS',
        },
      ],
    };
  }

  const selectSql = `SELECT ${columns
    .map(quoteIdent)
    .join(', ')} FROM ${tableIdent(schema, table)}`;
  const rows = (await sourceClient.query(selectSql)).rows;
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const insertSql = `
    INSERT INTO ${tableIdent(schema, table)}
      (${columns.map(quoteIdent).join(', ')})
    VALUES (${placeholders})
    ON CONFLICT DO NOTHING
  `;
  const report = {
    table,
    sourceRows,
    targetRowsBefore,
    attempted: rows.length,
    inserted: 0,
    conflicts: 0,
    fkSkipped: 0,
    criticalErrors: [],
  };

  for (const row of rows) {
    await targetClient.query('SAVEPOINT merge_row');

    try {
      const values = columns.map((column) => row[column]);
      const result = await targetClient.query(insertSql, values);

      if (result.rowCount === 1) {
        report.inserted += 1;
      } else {
        report.conflicts += 1;
      }

      await targetClient.query('RELEASE SAVEPOINT merge_row');
    } catch (error) {
      await targetClient.query('ROLLBACK TO SAVEPOINT merge_row');
      await targetClient.query('RELEASE SAVEPOINT merge_row');

      if (error.code === '23503') {
        report.fkSkipped += 1;
        continue;
      }

      if (report.criticalErrors.length < MAX_ERROR_SAMPLES) {
        report.criticalErrors.push(sanitizePgError(error));
      }

      if (!dryRun) {
        throw new Error(
          `Critical PostgreSQL error while merging table ${table}: ${error.code ?? 'UNKNOWN'}`,
        );
      }
    }
  }

  return report;
}

function sanitizePgError(error) {
  return {
    code: error.code ?? 'UNKNOWN',
    table: error.table,
    column: error.column,
    constraint: error.constraint,
    routine: error.routine,
  };
}

async function runMerge(
  sourceClient,
  targetClient,
  args,
  sourceConfig,
  targetConfig,
) {
  const plan = await buildMergePlan(sourceClient, targetClient, args.schema);
  const report = {
    generatedAt: new Date().toISOString(),
    command: 'merge',
    dryRun: args.dryRun,
    schema: args.schema,
    excludedTables: [...EXCLUDED_TABLES].sort(),
    source: safeConnectionSummary(sourceConfig),
    target: safeConnectionSummary(targetConfig),
    sourceMissingInTarget: plan.sourceMissingInTarget,
    dependencyCycles: plan.dependencyCycles,
    tables: [],
    totals: {
      attempted: 0,
      inserted: 0,
      conflicts: 0,
      fkSkipped: 0,
      criticalErrors: 0,
    },
    hasCriticalIssues: plan.sourceMissingInTarget.length > 0,
  };

  if (plan.sourceMissingInTarget.length > 0) {
    return report;
  }

  await targetClient.query('BEGIN');

  try {
    for (const table of plan.tables) {
      const tableReport = await mergeTable(
        sourceClient,
        targetClient,
        args.schema,
        table,
        args.dryRun,
      );

      report.tables.push(tableReport);
      report.totals.attempted += tableReport.attempted;
      report.totals.inserted += tableReport.inserted;
      report.totals.conflicts += tableReport.conflicts;
      report.totals.fkSkipped += tableReport.fkSkipped;
      report.totals.criticalErrors += tableReport.criticalErrors.length;
      report.hasCriticalIssues =
        report.hasCriticalIssues || tableReport.criticalErrors.length > 0;
    }

    if (args.dryRun) {
      await targetClient.query('ROLLBACK');
    } else {
      await targetClient.query('COMMIT');
    }
  } catch (error) {
    await targetClient.query('ROLLBACK');
    throw error;
  }

  return report;
}

function reportFilePath(command, explicitPath) {
  if (explicitPath) {
    return explicitPath;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const directory = join(process.cwd(), 'migration-reports');

  mkdirSync(directory, { recursive: true });

  return join(directory, `${timestamp}-${command}.json`);
}

function writeReport(report, command, explicitPath) {
  const filePath = reportFilePath(command, explicitPath);

  writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`);

  return filePath;
}

function printAuditSummary(report, filePath) {
  console.log(`Audit report: ${filePath}`);
  console.log(
    `Source tables: ${report.source.tables.included}, target tables: ${report.target.tables.included}`,
  );
  console.log(
    `Source latest migration: ${report.source.migrations.latest?.name ?? 'none'}`,
  );
  console.log(
    `Target latest migration: ${report.target.migrations.latest?.name ?? 'none'}`,
  );

  if (report.hasCriticalIssues) {
    console.log('Critical schema issues were detected. Review the report.');
  }
}

function printMergeSummary(report, filePath) {
  console.log(`Merge report: ${filePath}`);
  console.log(`Mode: ${report.dryRun ? 'dry-run' : 'execute'}`);
  console.log(`Attempted rows: ${report.totals.attempted}`);
  console.log(`Inserted rows: ${report.totals.inserted}`);
  console.log(`Conflicts kept in target: ${report.totals.conflicts}`);
  console.log(`Rows skipped by FK: ${report.totals.fkSkipped}`);
  console.log(`Critical errors: ${report.totals.criticalErrors}`);

  if (report.hasCriticalIssues) {
    console.log('Critical merge issues were detected. Review the report.');
  }
}

function printHelp() {
  console.log(`
Usage:
  node scripts/postgres-safe-merge.js audit [--schema public] [--report path]
  node scripts/postgres-safe-merge.js merge --dry-run [--schema public] [--report path]
  node scripts/postgres-safe-merge.js merge --execute [--schema public] [--report path]

Required source environment:
  SOURCE_DB_HOST, SOURCE_DB_PORT, SOURCE_DB_USERNAME, SOURCE_DB_PASSWORD, SOURCE_DB_DATABASE

Required target environment:
  TARGET_DB_HOST, TARGET_DB_PORT, TARGET_DB_USERNAME, TARGET_DB_PASSWORD, TARGET_DB_DATABASE

Target falls back to the selected DB profile when TARGET_DB_* is not set.
Set DB_USE_AZURE=true to select AZURE_DB_* or DB_*_CLOUD values, with DB_* fallback.
Use SOURCE_DB_SSL=true or TARGET_DB_SSL=true for TLS.
`);
}

async function main() {
  loadLocalEnvFile();

  const args = parseArgs(process.argv);

  if (
    args.command === 'help' ||
    args.command === '--help' ||
    args.command === '-h'
  ) {
    printHelp();
    return;
  }

  const sourceConfig = dbConfig('SOURCE');
  const targetConfig = dbConfig('TARGET', true);

  assertDbConfig(sourceConfig, 'Source');
  assertDbConfig(targetConfig, 'Target');

  const sourceClient = new Client(sourceConfig);
  const targetClient = new Client(targetConfig);

  await sourceClient.connect();
  await targetClient.connect();

  try {
    if (args.command === 'audit') {
      const report = await runAudit(
        sourceClient,
        targetClient,
        args,
        sourceConfig,
        targetConfig,
      );
      const filePath = writeReport(report, 'audit', args.reportPath);
      printAuditSummary(report, filePath);
      process.exitCode = report.hasCriticalIssues ? 2 : 0;
      return;
    }

    if (args.command === 'merge') {
      const report = await runMerge(
        sourceClient,
        targetClient,
        args,
        sourceConfig,
        targetConfig,
      );
      const filePath = writeReport(report, 'merge', args.reportPath);
      printMergeSummary(report, filePath);
      process.exitCode = report.hasCriticalIssues ? 2 : 0;
      return;
    }

    printHelp();
    process.exitCode = 1;
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

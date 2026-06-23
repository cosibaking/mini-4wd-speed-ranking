import fs from 'node:fs';
import path from 'node:path';

import { loadEnvFile } from '../lib/env.js';
import type { RowDataPacket } from 'mysql2/promise';

import { connectMysql, disconnectMysql, execute, query } from '../lib/mysql.js';

loadEnvFile();

async function runMigrations(): Promise<void> {
  await connectMysql();

  const migrationsDir = path.resolve(process.cwd(), 'db/migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.warn('[migrate] no migrations directory found');
    return;
  }

  await execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(128) NOT NULL PRIMARY KEY,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  const entries = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const entry of entries) {
    const sqlPath = path.join(migrationsDir, entry, 'migration.sql');
    if (!fs.existsSync(sqlPath)) {
      continue;
    }

    const applied = await query<RowDataPacket & { id: string }>(
      'SELECT id FROM schema_migrations WHERE id = ? LIMIT 1',
      [entry],
    );
    if (applied.length > 0) {
      console.log(`[migrate] skip ${entry}`);
      continue;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = sql
      .split(/;\s*\n/)
      .map((statement) =>
        statement
          .split('\n')
          .filter((line) => !line.trim().startsWith('--'))
          .join('\n')
          .trim(),
      )
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      await execute(statement);
    }

    await execute('INSERT INTO schema_migrations (id) VALUES (?)', [entry]);
    console.log(`[migrate] applied ${entry}`);
  }
}

runMigrations()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMysql();
  });

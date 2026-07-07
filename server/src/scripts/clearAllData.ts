/**
 * 清空所有业务数据（保留 schema_migrations 迁移记录）。
 *
 * 危险操作：会删除用户、赛道、成绩、社区、通知等全部业务记录。
 * 运行前必须设置环境变量 CONFIRM_CLEAR_ALL=yes。
 *
 * 运行：
 *   cd server && npm run build
 *   CONFIRM_CLEAR_ALL=yes node dist/scripts/clearAllData.js
 */
import { loadEnvFile } from '../lib/env.js';
import { config } from '../config/index.js';
import { connectMysql, disconnectMysql, execute, withTransaction } from '../lib/mysql.js';

loadEnvFile();

/** 业务表（不含 schema_migrations） */
const BUSINESS_TABLES = [
  'notifications',
  'comment_images',
  'comments',
  'post_images',
  'likes',
  'posts',
  'track_best_records',
  'record_car_photos',
  'records',
  'recent_track_visits',
  'track_floor_plans',
  'organizer_applications',
  'tracks',
  'follows',
  'media_objects',
  'users',
  'boards',
] as const;

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return '(invalid DATABASE_URL)';
  }
}

function requireConfirmation(): void {
  const confirmed = process.env.CONFIRM_CLEAR_ALL?.trim().toLowerCase();
  if (confirmed !== 'yes') {
    console.error(
      '[clear] 拒绝执行：请设置 CONFIRM_CLEAR_ALL=yes 以确认清空所有业务数据',
    );
    process.exit(1);
  }
}

async function clearAllData(): Promise<void> {
  await connectMysql();

  const dbLabel = maskDatabaseUrl(config.databaseUrl);
  console.log(`[clear] 目标数据库：${dbLabel}`);
  console.log(`[clear] 将清空 ${BUSINESS_TABLES.length} 张业务表，保留 schema_migrations`);

  await withTransaction(async () => {
    await execute('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of BUSINESS_TABLES) {
      await execute(`TRUNCATE TABLE \`${table}\``);
      console.log(`[clear] 已清空 ${table}`);
    }

    await execute('SET FOREIGN_KEY_CHECKS = 1');
  });

  console.log('[clear] 完成 ✅');
}

async function main(): Promise<void> {
  requireConfirmation();
  await clearAllData();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMysql();
  });

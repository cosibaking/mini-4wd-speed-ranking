import { createApp } from './app.js';
import { config } from './config/index.js';
import { printStartupConfig } from './config/print-config.js';
import { connectMysql, disconnectMysql } from './lib/mysql.js';
import { initRedis } from './lib/redis.js';

async function main(): Promise<void> {
  await initRedis();
  await connectMysql();

  const server = createApp();

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`[server] listening on http://0.0.0.0:${config.port}`);
    console.log(`[server] health check: http://localhost:${config.port}/api/v1/health`);
    printStartupConfig();
  });
}

main().catch(async (error: unknown) => {
  console.error('[server] failed to start', error);
  await disconnectMysql();
  process.exit(1);
});

async function shutdown(): Promise<void> {
  await disconnectMysql();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

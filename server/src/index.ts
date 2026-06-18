import { createApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';
import { initRedis } from './lib/redis.js';

async function main(): Promise<void> {
  await initRedis();
  await prisma.$connect();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`[server] listening on http://localhost:${config.port}`);
    console.log(`[server] health check: http://localhost:${config.port}/api/v1/health`);
  });
}

main().catch(async (error: unknown) => {
  console.error('[server] failed to start', error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

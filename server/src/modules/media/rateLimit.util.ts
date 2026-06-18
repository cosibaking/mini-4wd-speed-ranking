import { getRedis } from '../../lib/redis.js';

const memoryCounters = new Map<string, { count: number; expiresAt: number }>();

async function incrementCounter(key: string, windowSeconds: number): Promise<number> {
  const redis = getRedis();

  if (redis.isAvailable()) {
    const current = await redis.get(key);
    if (current === null) {
      await redis.set(key, '1', windowSeconds);
      return 1;
    }
    const next = Number(current) + 1;
    await redis.set(key, String(next), windowSeconds);
    return next;
  }

  const now = Date.now();
  const entry = memoryCounters.get(key);
  if (!entry || entry.expiresAt <= now) {
    memoryCounters.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

export async function checkUploadRateLimit(userId: string, purpose: string): Promise<boolean> {
  const count = await incrementCounter(`rl:media:${userId}:${purpose}`, 3600);
  return count <= 20;
}

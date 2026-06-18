import Redis from 'ioredis';

import { config } from '../config/index.js';

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(...keys: string[]): Promise<number>;
  isAvailable(): boolean;
}

class NoopRedisClient implements RedisClient {
  isAvailable(): boolean {
    return false;
  }

  async get(_key: string): Promise<string | null> {
    return null;
  }

  async set(_key: string, _value: string, _ttlSeconds?: number): Promise<void> {
    // no-op
  }

  async del(..._keys: string[]): Promise<number> {
    return 0;
  }
}

class IoredisClient implements RedisClient {
  private readonly client: Redis;
  private available = true;

  constructor(url: string) {
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    this.client.on('error', () => {
      this.available = false;
    });

    this.client.on('connect', () => {
      this.available = true;
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  isAvailable(): boolean {
    return this.available;
  }

  async get(key: string): Promise<string | null> {
    if (!this.available) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch {
      this.available = false;
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.available) {
      return;
    }
    try {
      if (ttlSeconds !== undefined) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      this.available = false;
    }
  }

  async del(...keys: string[]): Promise<number> {
    if (!this.available || keys.length === 0) {
      return 0;
    }
    try {
      return await this.client.del(...keys);
    } catch {
      this.available = false;
      return 0;
    }
  }
}

let redisClient: RedisClient = new NoopRedisClient();

export async function initRedis(): Promise<void> {
  if (!config.redisUrl) {
    console.warn('[redis] REDIS_URL not set, running without cache');
    redisClient = new NoopRedisClient();
    return;
  }

  const client = new IoredisClient(config.redisUrl);
  try {
    await client.connect();
    console.log('[redis] connected');
    redisClient = client;
  } catch (error) {
    console.warn('[redis] unavailable, degrading gracefully:', error);
    redisClient = new NoopRedisClient();
  }
}

export function getRedis(): RedisClient {
  return redisClient;
}

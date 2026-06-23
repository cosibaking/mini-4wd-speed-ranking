import { loadEnvFile } from '../lib/env.js';

loadEnvFile();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return value === 'true' || value === '1';
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: requireEnv('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL ?? '',
  jwt: {
    secret: requireEnv('JWT_SECRET', 'dev-secret-change-me'),
    expiresIn: Number(process.env.JWT_EXPIRES_IN ?? 604800),
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID ?? '',
    appSecret: process.env.WECHAT_APP_SECRET ?? '',
    mock: parseBoolean(process.env.WECHAT_MOCK, false),
    realNameMock: parseBoolean(process.env.WECHAT_REALNAME_MOCK, false),
    /** WECHAT_MOCK 下可选：固定登录 code，openId 为 mock_{code}，便于匹配 ADMIN_OPEN_IDS */
    mockLoginCode: process.env.MOCK_LOGIN_CODE?.trim() ?? '',
  },
  admin: {
    /** 小程序开发者/管理员 openId，逗号分隔，登录时自动授予 admin 角色 */
    openIds: (process.env.ADMIN_OPEN_IDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  },
} as const;

export const isDev = config.nodeEnv === 'development';

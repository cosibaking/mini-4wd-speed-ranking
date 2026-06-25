import { config, isDev } from './index.js';
import { maskConnectionUrl, maskIdentifier, maskSecret } from '../lib/mask.js';

function resolveMediaMock(): boolean {
  if (process.env.MEDIA_MOCK === 'true') {
    return true;
  }
  if (process.env.MEDIA_MOCK === 'false') {
    return false;
  }

  const hasCosConfig =
    Boolean(process.env.COS_SECRET_ID) &&
    Boolean(process.env.COS_SECRET_KEY) &&
    Boolean(process.env.COS_BUCKET) &&
    Boolean(process.env.COS_REGION);

  return isDev && !hasCosConfig;
}

function maskOptionalSecret(value: string | undefined): string {
  return value?.trim() ? maskSecret(value) : '(empty)';
}

function maskAdminOpenIds(openIds: readonly string[]): string {
  if (openIds.length === 0) {
    return '(empty)';
  }
  return openIds.map(maskIdentifier).join(', ');
}

export function printStartupConfig(): void {
  const mediaMock = resolveMediaMock();
  const cosSecretId = process.env.COS_SECRET_ID?.trim() ?? '';
  const cosSecretKey = process.env.COS_SECRET_KEY?.trim() ?? '';
  const tencentMapKey = process.env.TENCENT_MAP_KEY?.trim() ?? '';
  const tencentMapSk = process.env.TENCENT_MAP_SK?.trim() ?? '';
  const mockLoginCode = config.wechat.mockLoginCode;
  const mockMediaHost = process.env.MOCK_MEDIA_HOST?.trim() ?? '';

  console.log('[server] configuration:');
  console.log(`  nodeEnv=${config.nodeEnv}`);
  console.log(`  port=${config.port}`);
  console.log(`  databaseUrl=${maskConnectionUrl(config.databaseUrl)}`);
  console.log(
    `  redisUrl=${config.redisUrl ? maskConnectionUrl(config.redisUrl) : '(not configured)'}`,
  );
  console.log(`  jwt.secret=${maskSecret(config.jwt.secret)}`);
  console.log(`  jwt.expiresIn=${config.jwt.expiresIn}`);
  console.log(`  wechat.appId=${config.wechat.appId || '(empty)'}`);
  console.log(`  wechat.appSecret=${maskOptionalSecret(config.wechat.appSecret)}`);
  console.log(`  wechat.mock=${config.wechat.mock}`);
  console.log(`  wechat.realNameMock=${config.wechat.realNameMock}`);
  console.log(
    `  wechat.mockLoginCode=${mockLoginCode ? maskSecret(mockLoginCode) : '(empty)'}`,
  );
  console.log(`  admin.openIds=${maskAdminOpenIds(config.admin.openIds)}`);
  console.log(`  media.mock=${mediaMock}`);
  console.log(`  media.envPrefix=${process.env.MEDIA_ENV_PREFIX ?? (isDev ? 'dev' : 'prod')}`);
  console.log(`  media.cdnBaseUrl=${process.env.CDN_BASE_URL?.trim() || '(empty)'}`);
  console.log(`  media.cos.secretId=${cosSecretId ? maskSecret(cosSecretId) : '(empty)'}`);
  console.log(`  media.cos.secretKey=${cosSecretKey ? maskSecret(cosSecretKey) : '(empty)'}`);
  console.log(`  media.cos.bucket=${process.env.COS_BUCKET?.trim() || '(empty)'}`);
  console.log(`  media.cos.region=${process.env.COS_REGION?.trim() || '(empty)'}`);
  console.log(`  media.mockMediaHost=${mockMediaHost || '(default: 127.0.0.1)'}`);
  console.log(`  geo.tencentMapKey=${tencentMapKey ? maskSecret(tencentMapKey) : '(empty)'}`);
  console.log(`  geo.tencentMapSk=${tencentMapSk ? maskSecret(tencentMapSk) : '(empty)'}`);
}

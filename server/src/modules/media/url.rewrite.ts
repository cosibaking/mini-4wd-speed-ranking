import { config } from '../../config/index.js';
import { isMockMediaEnabled } from './path.builder.js';

export function rewriteMockMediaUrl(url: string, origin: string): string {
  if (!isMockMediaEnabled() || !url.includes('/mock-media/')) {
    return url;
  }

  const normalizedOrigin = origin.replace(/\/$/, '');
  return url.replace(/^https?:\/\/[^/]+/, normalizedOrigin);
}

export function rewriteMockMediaUrlsInValue(value: unknown, origin: string): unknown {
  if (typeof value === 'string') {
    return rewriteMockMediaUrl(value, origin);
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteMockMediaUrlsInValue(item, origin));
  }

  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input)) {
      output[key] = rewriteMockMediaUrlsInValue(input[key], origin);
    }
    return output;
  }

  return value;
}

export function getRequestOrigin(headers: Record<string, string | string[] | undefined>): string {
  const forwardedHost = headers['x-forwarded-host'];
  const hostHeader = forwardedHost ?? headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;

  if (host) {
    return `http://${host}`;
  }

  const mockHost = process.env.MOCK_MEDIA_HOST ?? '127.0.0.1';
  return `http://${mockHost}:${config.port}`;
}

export function getRequestMediaHost(headers: Record<string, string | string[] | undefined>): string | undefined {
  const hostHeader = headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) {
    return process.env.MOCK_MEDIA_HOST;
  }

  return host.split(':')[0];
}

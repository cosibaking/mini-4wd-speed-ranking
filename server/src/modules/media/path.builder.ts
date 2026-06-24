import { randomUUID } from 'node:crypto';

import { config, isDev } from '../../config/index.js';
import type { MediaFileExt, MediaPurpose } from './dto/upload-credential.dto.js';

const PURPOSE_SEGMENTS: Record<MediaPurpose, string> = {
  track_floor_plan: 'track/floor_plan',
  track_example_video: 'track/example_video',
  record_video: 'record/video',
  record_config: 'record/config',
  record_car_photo: 'record/car',
  post_image: 'post/image',
  comment_image: 'comment/image',
};

function getEnvPrefix(): string {
  return process.env.MEDIA_ENV_PREFIX ?? (isDev ? 'dev' : 'prod');
}

export function buildObjectKey(
  userId: string,
  purpose: MediaPurpose,
  fileExt: MediaFileExt,
): string {
  const env = getEnvPrefix();
  const segment = PURPOSE_SEGMENTS[purpose];
  const filename = `${randomUUID()}.${fileExt}`;
  return `${env}/${userId}/${segment}/${filename}`;
}

function getMockMediaHost(): string {
  return process.env.MOCK_MEDIA_HOST ?? '127.0.0.1';
}

export function buildPublicUrl(objectKey: string, mediaHost?: string): string {
  if (isMockMediaEnabled()) {
    const port = config.port;
    const host = mediaHost ?? getMockMediaHost();
    return `http://${host}:${port}/mock-media/${objectKey}`;
  }

  const cdnBase = process.env.CDN_BASE_URL ?? '';
  return `${cdnBase.replace(/\/$/, '')}/${objectKey}`;
}

const HTTPS_URL_RE = /^https:\/\/.+/;
const MOCK_MEDIA_URL_RE = /^https?:\/\/[^/]+\/mock-media\/.+/;

/** 生产/CDN 须 HTTPS；本地 mock 媒体允许 http://…/mock-media/… */
export function isValidMediaUrl(url: string): boolean {
  if (HTTPS_URL_RE.test(url)) {
    return true;
  }
  return isMockMediaEnabled() && MOCK_MEDIA_URL_RE.test(url);
}

export function isMockMediaEnabled(): boolean {
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

export function getMockUploadUrl(objectKey: string, mediaHost?: string): string {
  const port = config.port;
  const host = mediaHost ?? getMockMediaHost();
  return `http://${host}:${port}/mock-media/upload/${encodeURIComponent(objectKey)}`;
}

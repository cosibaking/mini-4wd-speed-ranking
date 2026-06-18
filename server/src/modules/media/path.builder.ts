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

export function buildPublicUrl(objectKey: string): string {
  const cdnBase = process.env.CDN_BASE_URL ?? 'http://localhost:3000/mock-media';
  return `${cdnBase.replace(/\/$/, '')}/${objectKey}`;
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

export function getMockUploadUrl(objectKey: string): string {
  const port = config.port;
  return `http://localhost:${port}/mock-media/upload/${encodeURIComponent(objectKey)}`;
}

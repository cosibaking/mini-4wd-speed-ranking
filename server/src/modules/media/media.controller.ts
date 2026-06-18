import type { Context } from 'koa';

import { ValidationError } from '../../shared/errors.js';
import { success } from '../../shared/response.js';
import type { MediaFileExt, MediaPurpose, UploadCredentialRequest } from './dto/upload-credential.dto.js';
import { mediaService } from './media.service.js';

const VALID_PURPOSES: MediaPurpose[] = [
  'track_floor_plan',
  'track_example_video',
  'record_video',
  'record_config',
  'record_car_photo',
  'post_image',
];

const VALID_EXTENSIONS: MediaFileExt[] = ['jpg', 'jpeg', 'png', 'mp4'];

function parseUploadCredentialBody(body: unknown): UploadCredentialRequest {
  const payload = body as Partial<UploadCredentialRequest>;

  if (payload.mediaType !== 'image' && payload.mediaType !== 'video') {
    throw new ValidationError('mediaType 无效');
  }

  if (!payload.purpose || !VALID_PURPOSES.includes(payload.purpose)) {
    throw new ValidationError('purpose 无效');
  }

  if (!payload.fileExt || !VALID_EXTENSIONS.includes(payload.fileExt)) {
    throw new ValidationError('fileExt 无效');
  }

  if (typeof payload.fileSize !== 'number' || !Number.isFinite(payload.fileSize)) {
    throw new ValidationError('fileSize 无效');
  }

  return {
    mediaType: payload.mediaType,
    purpose: payload.purpose,
    fileExt: payload.fileExt,
    fileSize: payload.fileSize,
  };
}

export async function uploadCredential(ctx: Context): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const req = parseUploadCredentialBody(ctx.request.body);
  const data = await mediaService.getUploadCredential(userId, req);
  ctx.body = success(data);
}

export async function confirmUpload(ctx: Context): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const body = ctx.request.body as { objectKey?: string };

  if (!body.objectKey || typeof body.objectKey !== 'string') {
    throw new ValidationError('objectKey 必填');
  }

  const data = await mediaService.confirmUpload(userId, body.objectKey);
  ctx.body = success(data);
}

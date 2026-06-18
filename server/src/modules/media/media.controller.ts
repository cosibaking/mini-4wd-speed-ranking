import type { IncomingMessage } from 'node:http';

import type { HttpContext } from '../../lib/http/index.js';
import { ValidationError } from '../../shared/errors.js';
import { success } from '../../shared/response.js';
import type { MediaFileExt, MediaPurpose, UploadCredentialRequest } from './dto/upload-credential.dto.js';
import { uploadRecordNotFoundError } from './errors.js';
import { mediaRepository } from './media.repository.js';
import { mediaService } from './media.service.js';
import { saveObject } from './mock.store.js';
import { parseMultipartBody } from './multipart.util.js';
import { isMockMediaEnabled } from './path.builder.js';
async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function mockUpload(ctx: HttpContext): Promise<void> {
  if (!isMockMediaEnabled()) {
    ctx.status = 404;
    ctx.body = { code: 40404, message: 'Not Found', data: null };
    return;
  }

  const userId = ctx.state.auth!.userId;
  const rawBody = await readRawBody(ctx.rawRequest);
  const contentType = ctx.headers['content-type'];
  const normalizedContentType = Array.isArray(contentType) ? contentType[0] : contentType;
  const { fields, file } = parseMultipartBody(rawBody, normalizedContentType);
  const objectKey = fields.objectKey?.trim();

  if (!objectKey) {
    throw new ValidationError('objectKey 必填');
  }

  const record = await mediaRepository.findByObjectKeyAndUser(objectKey, userId);
  if (!record || record.status !== 'pending') {
    throw uploadRecordNotFoundError();
  }

  if (file.length === 0) {
    throw new ValidationError('文件为空');
  }

  await saveObject(objectKey, file);
  ctx.body = success(null);
}

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

export async function uploadCredential(ctx: HttpContext): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const req = parseUploadCredentialBody(ctx.request.body);
  const data = await mediaService.getUploadCredential(userId, req);
  ctx.body = success(data);
}

export async function confirmUpload(ctx: HttpContext): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const body = ctx.request.body as { objectKey?: string };

  if (!body.objectKey || typeof body.objectKey !== 'string') {
    throw new ValidationError('objectKey 必填');
  }

  const data = await mediaService.confirmUpload(userId, body.objectKey);
  ctx.body = success(data);
}

import type { IncomingMessage } from 'node:http';

import type { HttpContext } from '../../lib/http/index.js';
import { ValidationError } from '../../shared/errors.js';
import { success } from '../../shared/response.js';
import type { MediaFileExt, MediaPurpose, UploadCredentialRequest } from './dto/upload-credential.dto.js';
import { fileSizeExceededError, uploadRecordNotFoundError } from './errors.js';
import { uploadObject } from './cos.client.js';
import { mediaRepository } from './media.repository.js';
import { mediaService } from './media.service.js';
import { parseMultipartBody } from './multipart.util.js';
import { getContentType } from './policy.validator.js';
import { isMockMediaEnabled } from './path.builder.js';
import { getRequestMediaHost } from './url.rewrite.js';

async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function inferFileExt(objectKey: string): MediaFileExt {
  const ext = objectKey.split('.').pop()?.toLowerCase();
  if (ext === 'mp4') return 'mp4';
  if (ext === 'png') return 'png';
  if (ext === 'jpeg') return 'jpeg';
  if (ext === 'jpg') return 'jpg';
  throw new ValidationError('objectKey 扩展名无效');
}

async function handleMultipartUpload(ctx: HttpContext): Promise<void> {
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

  if (file.length > record.fileSize) {
    throw fileSizeExceededError();
  }

  const fileExt = inferFileExt(objectKey);
  const mimeType = getContentType(fileExt);
  await uploadObject(objectKey, file, mimeType);
}

export async function proxyUpload(ctx: HttpContext): Promise<void> {
  await handleMultipartUpload(ctx);
  ctx.body = success(null);
}

export async function mockUpload(ctx: HttpContext): Promise<void> {
  if (!isMockMediaEnabled()) {
    ctx.status = 404;
    ctx.body = { code: 40404, message: 'Not Found', data: null };
    return;
  }

  await proxyUpload(ctx);
}

const VALID_PURPOSES: MediaPurpose[] = [
  'track_floor_plan',
  'track_example_video',
  'record_video',
  'record_config',
  'record_car_photo',
  'post_image',
  'comment_image',
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
  const mediaHost = getRequestMediaHost(ctx.headers);
  const data = await mediaService.getUploadCredential(userId, req, mediaHost);
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

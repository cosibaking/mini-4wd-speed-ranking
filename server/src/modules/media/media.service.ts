import { ValidationError } from '../../shared/errors.js';
import { createPresignedPut, verifyObjectExists } from './cos.client.js';
import type {
  MediaMeta,
  UploadCredential,
  UploadCredentialRequest,
} from './dto/upload-credential.dto.js';
import {
  cloudFileNotFoundError,
  uploadRateLimitError,
  uploadRecordNotFoundError,
} from './errors.js';
import { mediaRepository } from './media.repository.js';
import { buildObjectKey, buildPublicUrl } from './path.builder.js';
import { validateUploadRequest } from './policy.validator.js';
import { checkUploadRateLimit } from './rateLimit.util.js';

export class MediaService {
  async getUploadCredential(
    userId: string,
    req: UploadCredentialRequest,
  ): Promise<UploadCredential> {
    validateUploadRequest(req);

    const allowed = await checkUploadRateLimit(userId, req.purpose);
    if (!allowed) {
      throw uploadRateLimitError();
    }

    const objectKey = buildObjectKey(userId, req.purpose, req.fileExt);
    const publicUrl = buildPublicUrl(objectKey);
    const presigned = await createPresignedPut(objectKey, req.fileExt, req.fileSize);

    await mediaRepository.insertPending({
      objectKey,
      userId,
      mediaType: req.mediaType,
      purpose: req.purpose,
      publicUrl,
      fileSize: req.fileSize,
    });

    return {
      uploadUrl: presigned.uploadUrl,
      objectKey,
      publicUrl,
      expireAt: presigned.expireAt,
      headers: presigned.headers,
    };
  }

  async confirmUpload(userId: string, objectKey: string): Promise<MediaMeta> {
    if (!objectKey.trim()) {
      throw new ValidationError('objectKey 必填');
    }

    const record = await mediaRepository.findByObjectKeyAndUser(objectKey, userId);
    if (!record) {
      throw uploadRecordNotFoundError();
    }

    if (record.status === 'confirmed') {
      return {
        objectKey: record.objectKey,
        publicUrl: record.publicUrl,
        mediaType: record.mediaType,
        purpose: record.purpose as UploadCredentialRequest['purpose'],
        fileSize: record.fileSize,
        status: 'confirmed',
      };
    }

    const exists = await verifyObjectExists(objectKey);
    if (!exists) {
      throw cloudFileNotFoundError();
    }

    const confirmed = await mediaRepository.confirm(objectKey);

    return {
      objectKey: confirmed.objectKey,
      publicUrl: confirmed.publicUrl,
      mediaType: confirmed.mediaType,
      purpose: confirmed.purpose as UploadCredentialRequest['purpose'],
      fileSize: confirmed.fileSize,
      status: 'confirmed',
    };
  }

  async purgeOrphans(olderThanHours: number): Promise<number> {
    return mediaRepository.deletePendingOlderThan(olderThanHours);
  }
}

export const mediaService = new MediaService();

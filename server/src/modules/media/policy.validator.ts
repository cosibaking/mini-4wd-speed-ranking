import type { MediaFileExt, MediaPurpose, UploadCredentialRequest } from './dto/upload-credential.dto.js';
import { fileSizeExceededError, unsupportedMediaTypeError } from './errors.js';

const MB = 1024 * 1024;

interface PurposePolicy {
  mediaType: 'image' | 'video';
  extensions: MediaFileExt[];
  maxSize: number;
}

const POLICIES: Record<MediaPurpose, PurposePolicy> = {
  track_floor_plan: {
    mediaType: 'image',
    extensions: ['jpg', 'jpeg', 'png'],
    maxSize: 10 * MB,
  },
  track_example_video: {
    mediaType: 'video',
    extensions: ['mp4'],
    maxSize: 100 * MB,
  },
  record_video: {
    mediaType: 'video',
    extensions: ['mp4'],
    maxSize: 100 * MB,
  },
  record_config: {
    mediaType: 'image',
    extensions: ['jpg', 'jpeg', 'png'],
    maxSize: 10 * MB,
  },
  record_car_photo: {
    mediaType: 'image',
    extensions: ['jpg', 'jpeg', 'png'],
    maxSize: 10 * MB,
  },
  post_image: {
    mediaType: 'image',
    extensions: ['jpg', 'jpeg', 'png'],
    maxSize: 10 * MB,
  },
  comment_image: {
    mediaType: 'image',
    extensions: ['jpg', 'jpeg', 'png'],
    maxSize: 10 * MB,
  },
};

export function getContentType(fileExt: MediaFileExt): string {
  if (fileExt === 'mp4') {
    return 'video/mp4';
  }
  if (fileExt === 'png') {
    return 'image/png';
  }
  return 'image/jpeg';
}

export function validateUploadRequest(req: UploadCredentialRequest): PurposePolicy {
  const policy = POLICIES[req.purpose];
  if (!policy) {
    throw unsupportedMediaTypeError();
  }

  if (policy.mediaType !== req.mediaType) {
    throw unsupportedMediaTypeError();
  }

  if (!policy.extensions.includes(req.fileExt)) {
    throw unsupportedMediaTypeError();
  }

  if (req.fileSize <= 0 || req.fileSize > policy.maxSize) {
    throw fileSizeExceededError();
  }

  return policy;
}

export function getPurposePolicy(purpose: MediaPurpose): PurposePolicy {
  const policy = POLICIES[purpose];
  if (!policy) {
    throw unsupportedMediaTypeError();
  }
  return policy;
}

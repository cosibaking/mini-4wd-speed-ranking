import { isValidMediaUrl } from '../../media/path.builder.js';
import type { SubmitRecordDto } from './record.types';
import {
  invalidLapTimeError,
  maxCarPhotosError,
  validationError,
} from '../errors';

export function validateSubmitRecordDto(body: unknown): SubmitRecordDto {
  const dto = body as SubmitRecordDto;

  if (!dto?.trackId) {
    throw validationError('trackId 为必填项');
  }
  if (!dto.lapTimeDisplay) {
    throw validationError('圈速为必填项');
  }
  if (!dto.videoUrl || !isValidMediaUrl(dto.videoUrl)) {
    throw validationError('视频 URL 须为 HTTPS');
  }
  if (dto.carPhotoUrls) {
    if (dto.carPhotoUrls.length > 3) {
      throw maxCarPhotosError();
    }
    for (const url of dto.carPhotoUrls) {
      if (!isValidMediaUrl(url)) {
        throw validationError('车辆照片须为 HTTPS URL');
      }
    }
  }
  if (dto.note && dto.note.length > 100) {
    throw validationError('备注不超过 100 字');
  }
  if (dto.configSheet) {
    if (dto.configSheet.type === 'text') {
      if (!dto.configSheet.content || dto.configSheet.content.length > 1000) {
        throw validationError('配置单文字不超过 1000 字');
      }
    } else if (dto.configSheet.type === 'image') {
      if (!dto.configSheet.url || !isValidMediaUrl(dto.configSheet.url)) {
        throw validationError('配置单图片须为 HTTPS URL');
      }
    } else {
      throw validationError('配置单类型无效');
    }
  }

  return {
    trackId: dto.trackId,
    lapTimeDisplay: dto.lapTimeDisplay,
    videoUrl: dto.videoUrl,
    configSheet: dto.configSheet,
    carPhotoUrls: dto.carPhotoUrls,
    note: dto.note?.trim(),
  };
}

export { invalidLapTimeError };

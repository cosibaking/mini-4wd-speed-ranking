import { isValidMediaUrl } from '../../media/path.builder.js';
import type { CreateTrackDto, UpdateTrackDto } from '../dto/track.types';
import { validationError } from '../errors';

function validateLocation(
  location: CreateTrackDto['location'],
  fieldPrefix = 'location',
): void {
  if (!location) {
    throw validationError(`${fieldPrefix} 为必填项`);
  }
  const { lat, lng, address } = location;
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    throw validationError('坐标格式无效');
  }
  if (lat < 3 || lat > 54 || lng < 73 || lng > 136) {
    throw validationError('坐标超出中国境内合理范围');
  }
  if (!address || address.trim().length === 0 || address.length > 255) {
    throw validationError('地址为必填项，且不超过 255 字');
  }
}

function validateName(name: string | undefined, required = true): string {
  if (!name || name.trim().length === 0) {
    if (required) {
      throw validationError('赛道名称为必填项');
    }
    return '';
  }
  const trimmed = name.trim();
  if (trimmed.length > 20) {
    throw validationError('赛道名称不超过 20 字');
  }
  return trimmed;
}

function validateUrls(urls: string[] | undefined, max: number, label: string): void {
  if (!urls) {
    return;
  }
  if (urls.length > max) {
    throw validationError(`${label}最多 ${max} 个`);
  }
  for (const url of urls) {
    if (!isValidMediaUrl(url)) {
      throw validationError(`${label}须为 HTTPS URL`);
    }
  }
}

export function validateCreateTrackDto(body: unknown): CreateTrackDto {
  const dto = body as CreateTrackDto;
  const name = validateName(dto?.name);
  validateLocation(dto?.location);

  if (!dto.organizerName || dto.organizerName.trim().length === 0) {
    throw validationError('主理人姓名为必填项');
  }
  if (dto.organizerName.length > 64) {
    throw validationError('主理人姓名不超过 64 字');
  }
  if (dto.organizerContact && dto.organizerContact.length > 128) {
    throw validationError('联系方式不超过 128 字');
  }
  if (dto.lengthMeters !== undefined && dto.lengthMeters !== null) {
    if (
      typeof dto.lengthMeters !== 'number' ||
      !Number.isFinite(dto.lengthMeters) ||
      dto.lengthMeters < 1 ||
      dto.lengthMeters > 10_000
    ) {
      throw validationError('赛道长度须在 1–10000 米之间的整数');
    }
  }
  validateUrls(dto.floorPlanUrls, 3, '平面图');
  if (dto.exampleVideoUrl && !isValidMediaUrl(dto.exampleVideoUrl)) {
    throw validationError('示例视频须为 HTTPS URL');
  }
  if (dto.ruleNote && dto.ruleNote.length > 500) {
    throw validationError('认定说明不超过 500 字');
  }

  return {
    name,
    location: {
      lat: dto.location.lat,
      lng: dto.location.lng,
      address: dto.location.address.trim(),
    },
    organizerName: dto.organizerName.trim(),
    organizerContact: dto.organizerContact?.trim(),
    lengthMeters: dto.lengthMeters,
    floorPlanUrls: dto.floorPlanUrls,
    exampleVideoUrl: dto.exampleVideoUrl,
    ruleNote: dto.ruleNote?.trim(),
  };
}

export function validateUpdateTrackDto(body: unknown): UpdateTrackDto {
  const dto = body as UpdateTrackDto;
  const result: UpdateTrackDto = {};

  if (dto.name !== undefined) {
    result.name = validateName(dto.name);
  }
  if (dto.location !== undefined) {
    validateLocation(dto.location);
    result.location = {
      lat: dto.location.lat,
      lng: dto.location.lng,
      address: dto.location.address.trim(),
    };
  }
  if (dto.organizerName !== undefined) {
    if (dto.organizerName.trim().length === 0 || dto.organizerName.length > 64) {
      throw validationError('主理人姓名无效');
    }
    result.organizerName = dto.organizerName.trim();
  }
  if (dto.organizerContact !== undefined) {
    if (dto.organizerContact.length > 128) {
      throw validationError('联系方式不超过 128 字');
    }
    result.organizerContact = dto.organizerContact.trim() || undefined;
  }
  if (dto.lengthMeters !== undefined && dto.lengthMeters !== null) {
    if (
      typeof dto.lengthMeters !== 'number' ||
      !Number.isFinite(dto.lengthMeters) ||
      dto.lengthMeters < 1 ||
      dto.lengthMeters > 10_000
    ) {
      throw validationError('赛道长度须在 1–10000 米之间的整数');
    }
    result.lengthMeters = dto.lengthMeters;
  }
  if (dto.floorPlanUrls !== undefined) {
    validateUrls(dto.floorPlanUrls, 3, '平面图');
    result.floorPlanUrls = dto.floorPlanUrls;
  }
  if (dto.exampleVideoUrl !== undefined) {
    if (dto.exampleVideoUrl && !isValidMediaUrl(dto.exampleVideoUrl)) {
      throw validationError('示例视频须为 HTTPS URL');
    }
    result.exampleVideoUrl = dto.exampleVideoUrl || undefined;
  }
  if (dto.ruleNote !== undefined) {
    if (dto.ruleNote.length > 500) {
      throw validationError('认定说明不超过 500 字');
    }
    result.ruleNote = dto.ruleNote.trim() || undefined;
  }

  return result;
}

export function parseTrackListQuery(query: Record<string, unknown>): {
  page: number;
  pageSize: number;
  keyword?: string;
  lat?: number;
  lng?: number;
  sort: 'distance' | 'latest';
} {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20));
  const keyword =
    typeof query.keyword === 'string' ? query.keyword.trim() || undefined : undefined;
  const latRaw = query.lat !== undefined ? Number(query.lat) : undefined;
  const lngRaw = query.lng !== undefined ? Number(query.lng) : undefined;
  const lat = latRaw !== undefined && Number.isFinite(latRaw) ? latRaw : undefined;
  const lng = lngRaw !== undefined && Number.isFinite(lngRaw) ? lngRaw : undefined;
  const sortExplicit =
    query.sort === 'distance' || query.sort === 'latest' ? query.sort : undefined;
  const sort: 'distance' | 'latest' =
    sortExplicit ?? (lat !== undefined && lng !== undefined ? 'distance' : 'latest');

  return { page, pageSize, keyword, lat, lng, sort };
}

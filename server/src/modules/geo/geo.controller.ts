import type { HttpContext } from '../../lib/http/index.js';
import { ValidationError } from '../../shared/errors.js';
import { success } from '../../shared/response.js';
import { reverseGeocode, searchPlaces, suggestPlaces } from './geo.service.js';

function parseCoord(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseKeyword(ctx: HttpContext): string {
  const keyword = String(ctx.query.keyword || '').trim();
  if (!keyword) {
    throw new ValidationError('keyword 不能为空');
  }
  return keyword;
}

export async function reverseGeocodeHandler(ctx: HttpContext): Promise<void> {
  const lat = Number(ctx.query.lat);
  const lng = Number(ctx.query.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ValidationError('lat/lng 无效');
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new ValidationError('lat/lng 超出范围');
  }

  const address = await reverseGeocode(lat, lng);
  ctx.body = success({ address });
}

export async function searchPlacesHandler(ctx: HttpContext): Promise<void> {
  const keyword = parseKeyword(ctx);
  const lat = parseCoord(ctx.query.lat);
  const lng = parseCoord(ctx.query.lng);
  const places = await searchPlaces(keyword, lat, lng);
  ctx.body = success({ places });
}

export async function suggestPlacesHandler(ctx: HttpContext): Promise<void> {
  const keyword = parseKeyword(ctx);
  const lat = parseCoord(ctx.query.lat);
  const lng = parseCoord(ctx.query.lng);
  const places = await suggestPlaces(keyword, lat, lng);
  ctx.body = success({ places });
}

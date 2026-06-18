import type { HttpContext } from '../../lib/http/index.js';
import { ValidationError } from '../../shared/errors.js';
import { success } from '../../shared/response.js';
import { reverseGeocode } from './geo.service.js';

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

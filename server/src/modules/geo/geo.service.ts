import { createHash } from 'node:crypto';

import { ValidationError } from '../../shared/errors.js';

export interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface TencentGeocodeResponse {
  status: number;
  message?: string;
  result?: {
    address?: string;
    formatted_addresses?: {
      recommend?: string;
      rough?: string;
    };
  };
}

interface TencentPlaceItem {
  title?: string;
  address?: string;
  location?: { lat?: number; lng?: number };
}

interface TencentPlaceResponse {
  status: number;
  message?: string;
  data?: TencentPlaceItem[];
}

function buildTencentSig(path: string, params: Record<string, string>, sk: string): string {
  const query = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('md5').update(`${path}?${query}${sk}`).digest('hex');
}

function getTencentMapKey(): string {
  const key = process.env.TENCENT_MAP_KEY?.trim();
  if (!key) {
    throw new ValidationError('地图服务未配置');
  }
  return key;
}

async function callTencentMapApi<T extends { status: number; message?: string }>(
  path: string,
  params: Record<string, string>,
  errorMessage: string
): Promise<T> {
  const key = getTencentMapKey();
  const requestParams: Record<string, string> = { ...params, key };
  const sk = process.env.TENCENT_MAP_SK?.trim();
  if (sk) {
    requestParams.sig = buildTencentSig(path, requestParams, sk);
  }

  const url = new URL(`https://apis.map.qq.com${path}`);
  for (const [k, v] of Object.entries(requestParams)) {
    url.searchParams.set(k, v);
  }

  let data: T;
  try {
    const res = await fetch(url.toString());
    data = (await res.json()) as T;
  } catch {
    throw new ValidationError(`${errorMessage}，请检查网络后重试`);
  }

  if (data.status === 0) {
    return data;
  }

  if (data.status === 111 && !sk) {
    throw new ValidationError('请在 server/.env 配置 TENCENT_MAP_SK');
  }

  throw new ValidationError(data.message || errorMessage);
}

function extractAddress(data: TencentGeocodeResponse): string | null {
  const result = data.result;
  if (!result) {
    return null;
  }
  return (
    result.formatted_addresses?.recommend?.trim() ||
    result.formatted_addresses?.rough?.trim() ||
    result.address?.trim() ||
    null
  );
}

function mapPlaceItems(items: TencentPlaceItem[] | undefined): PlaceResult[] {
  if (!items?.length) {
    return [];
  }

  const places: PlaceResult[] = [];
  for (const item of items) {
    const lat = item.location?.lat;
    const lng = item.location?.lng;
    const name = item.title?.trim();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !name) {
      continue;
    }
    places.push({
      name,
      address: item.address?.trim() || name,
      lat: lat as number,
      lng: lng as number,
    });
  }
  return places;
}

function buildSearchBoundary(lat?: number, lng?: number): string {
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `nearby(${lat},${lng},100000,1)`;
  }
  return 'region(全国,0)';
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const data = await callTencentMapApi<TencentGeocodeResponse>(
    '/ws/geocoder/v1/',
    { location: `${lat},${lng}` },
    '地址解析失败'
  );
  const address = extractAddress(data);
  if (address) {
    return address;
  }
  throw new ValidationError('地址解析失败，请重新选择位置');
}

export async function searchPlaces(
  keyword: string,
  lat?: number,
  lng?: number
): Promise<PlaceResult[]> {
  const data = await callTencentMapApi<TencentPlaceResponse>(
    '/ws/place/v1/search',
    {
      keyword,
      boundary: buildSearchBoundary(lat, lng),
      page_size: '10',
      page_index: '1',
    },
    '地点搜索失败'
  );
  return mapPlaceItems(data.data);
}

export async function suggestPlaces(
  keyword: string,
  lat?: number,
  lng?: number
): Promise<PlaceResult[]> {
  const params: Record<string, string> = {
    keyword,
    page_size: '10',
  };
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    params.location = `${lat},${lng}`;
  }

  try {
    const data = await callTencentMapApi<TencentPlaceResponse>(
      '/ws/place/v1/suggestion',
      params,
      '地点联想失败'
    );
    return mapPlaceItems(data.data);
  } catch {
    // 联想接口配额独立且较低，耗尽时回退到地点搜索
    return searchPlaces(keyword, lat, lng);
  }
}

import { createHash } from 'node:crypto';

import { ValidationError } from '../../shared/errors.js';

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

function buildTencentSig(path: string, params: Record<string, string>, sk: string): string {
  const query = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('md5').update(`${path}?${query}${sk}`).digest('hex');
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

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = process.env.TENCENT_MAP_KEY?.trim();
  if (!key) {
    throw new ValidationError('地图服务未配置');
  }

  const path = '/ws/geocoder/v1/';
  const params: Record<string, string> = {
    key,
    location: `${lat},${lng}`,
  };

  const sk = process.env.TENCENT_MAP_SK?.trim();
  if (sk) {
    params.sig = buildTencentSig(path, params, sk);
  }

  const url = new URL(`https://apis.map.qq.com${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  let data: TencentGeocodeResponse;
  try {
    const res = await fetch(url.toString());
    data = (await res.json()) as TencentGeocodeResponse;
  } catch {
    throw new ValidationError('地址解析失败，请检查网络后重试');
  }

  if (data.status === 0) {
    const address = extractAddress(data);
    if (address) {
      return address;
    }
  }

  if (data.status === 111 && !sk) {
    throw new ValidationError('请在 server/.env 配置 TENCENT_MAP_SK');
  }

  throw new ValidationError(data.message || '地址解析失败，请重新选择位置');
}

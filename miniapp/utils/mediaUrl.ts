import { API_BASE } from '../config';

/** 将相对 mock 路径或旧版绝对 mock URL 解析为可请求的完整地址 */
export function resolveMediaUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  if (url.startsWith('/mock-media/')) {
    const originMatch = API_BASE.match(/^(https?:\/\/[^/]+)/);
    return originMatch ? `${originMatch[1]}${url}` : url;
  }

  if (!url.includes('/mock-media/')) {
    return url;
  }

  const originMatch = API_BASE.match(/^(https?:\/\/[^/]+)/);
  if (!originMatch) {
    return url;
  }

  return url.replace(/^https?:\/\/[^/]+/, originMatch[1]);
}

/** 兼容 imageUrls / images 字段，以及误传的单字符串或对象数组 */
export function normalizeUrlList(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [resolveMediaUrl(trimmed)] : [];
  }
  if (!Array.isArray(value)) return [];

  const urls: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed) urls.push(resolveMediaUrl(trimmed));
      continue;
    }
    if (item && typeof item === 'object') {
      const record = item as { imageUrl?: string; url?: string };
      const raw = record.imageUrl ?? record.url;
      if (typeof raw === 'string' && raw.trim()) {
        urls.push(resolveMediaUrl(raw.trim()));
      }
    }
  }
  return urls;
}

const displayUrlCache = new Map<string, string>();

/** 真机调试时 network image 可能无法直接渲染，下载到本地临时路径后展示 */
export function resolveDisplayImageUrl(url: string, force = false): Promise<string> {
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return Promise.resolve(url);
  }

  const resolved = resolveMediaUrl(url);
  if (!force) {
    const cached = displayUrlCache.get(resolved);
    if (cached) return Promise.resolve(cached);
  }

  return new Promise((resolve) => {
    wx.downloadFile({
      url: resolved,
      success(res) {
        if (res.statusCode === 200 && res.tempFilePath) {
          displayUrlCache.set(resolved, res.tempFilePath);
          resolve(res.tempFilePath);
          return;
        }
        resolve(resolved);
      },
      fail() {
        resolve(resolved);
      },
    });
  });
}

export async function resolveDisplayImageUrls(urls: string[], force = false): Promise<string[]> {
  return Promise.all(urls.map((url) => resolveDisplayImageUrl(url, force)));
}

export function resolveMediaUrlsInData<T>(data: T): T {
  if (typeof data === 'string') {
    return resolveMediaUrl(data) as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => resolveMediaUrlsInData(item)) as T;
  }

  if (data && typeof data === 'object') {
    const input = data as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input)) {
      output[key] = resolveMediaUrlsInData(input[key]);
    }
    return output as T;
  }

  return data;
}

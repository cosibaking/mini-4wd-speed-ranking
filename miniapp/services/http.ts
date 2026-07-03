import { API_BASE } from '../config';
import type { ApiResponse } from '../types';
import { resolveMediaUrlsInData } from '../utils/mediaUrl';

const TOKEN_KEY = 'token';

function getToken(): string {
  return (wx.getStorageSync(TOKEN_KEY) as string) || '';
}

function setToken(token: string): void {
  wx.setStorageSync(TOKEN_KEY, token);
}

function clearToken(): void {
  wx.removeStorageSync(TOKEN_KEY);
}

interface RawRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
  skipAuth?: boolean;
}

function rawRequest<T>(options: RawRequestOptions): Promise<T> {
  const { url, data, skipAuth } = options;
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) header['Authorization'] = `Bearer ${token}`;
  }

  // 「接口一律 POST」：忽略调用方传入的 method，统一以 POST 发送，
  // 参数一律走 JSON body（服务端会把标量字段合并进 query 以兼容原有读取方式）。
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      data,
      header,
      success: (res) => {
        const body = res.data as ApiResponse<T>;
        if (body.code === 0) {
          resolve(resolveMediaUrlsInData(body.data));
          return;
        }
        if (body.code === 40100) {
          reject(new Error(body.message || '请先登录'));
          return;
        }
        reject(new Error(body.message || '请求失败'));
      },
      fail: (err) => reject(err),
    });
  });
}

export async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    data?: Record<string, unknown>;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', data, auth = true } = options;
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  return rawRequest<T>({
    url,
    method,
    data,
    skipAuth: !auth,
  });
}

export function getApiBase(): string {
  return API_BASE;
}

export { getToken, setToken, clearToken };

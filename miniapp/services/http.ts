import {
  API_BASE,
  CLOUD_ENV,
  CLOUD_PATH_PREFIX,
  CLOUD_SERVICE,
  USE_CLOUD_CONTAINER,
} from '../config';
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
  path: string;
  data?: Record<string, unknown>;
  skipAuth?: boolean;
}

function buildHeader(skipAuth?: boolean): Record<string, string> {
  const header: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (!skipAuth) {
    const token = getToken();
    if (token) header['Authorization'] = `Bearer ${token}`;
  }
  return header;
}

function handleBody<T>(
  raw: unknown,
  resolve: (value: T) => void,
  reject: (reason: Error) => void
): void {
  const body = raw as ApiResponse<T> | undefined;
  if (!body || typeof body !== 'object') {
    reject(new Error('服务器响应异常'));
    return;
  }
  if (body.code === 0) {
    resolve(resolveMediaUrlsInData(body.data));
    return;
  }
  if (body.code === 40100) {
    reject(new Error(body.message || '请先登录'));
    return;
  }
  reject(new Error(body.message || '请求失败'));
}

// 微信云托管调用：绕过 request 合法域名校验（免备案）。
function sendViaContainer<T>(
  path: string,
  data: Record<string, unknown> | undefined,
  header: Record<string, string>
): Promise<T> {
  return new Promise((resolve, reject) => {
    // callContainer 在部分类型定义中缺失，做一次断言。
    const cloud = wx.cloud as unknown as {
      callContainer: (opts: Record<string, unknown>) => void;
    };
    cloud.callContainer({
      config: { env: CLOUD_ENV },
      path: `${CLOUD_PATH_PREFIX}${path}`,
      method: 'POST',
      header: { ...header, 'X-WX-SERVICE': CLOUD_SERVICE },
      data,
      success: (res: { data: unknown }) => handleBody<T>(res.data, resolve, reject),
      fail: (err: unknown) => reject(err instanceof Error ? err : new Error('网络请求失败')),
    });
  });
}

// 传统 HTTP 调用：本地开发（需在开发者工具勾选“不校验合法域名”）。
function sendViaRequest<T>(
  url: string,
  data: Record<string, unknown> | undefined,
  header: Record<string, string>
): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'POST',
      data,
      header,
      success: (res) => handleBody<T>(res.data, resolve, reject),
      fail: (err) => reject(err instanceof Error ? err : new Error('网络请求失败')),
    });
  });
}

function rawRequest<T>(options: RawRequestOptions): Promise<T> {
  const { path, data, skipAuth } = options;
  const header = buildHeader(skipAuth);

  // 「接口一律 POST」：统一以 POST 发送，参数走 JSON body。
  if (USE_CLOUD_CONTAINER && !path.startsWith('http')) {
    return sendViaContainer<T>(path, data, header);
  }
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return sendViaRequest<T>(url, data, header);
}

export async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    data?: Record<string, unknown>;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { data, auth = true } = options;
  return rawRequest<T>({
    path,
    data,
    skipAuth: !auth,
  });
}

export function getApiBase(): string {
  return API_BASE;
}

export { getToken, setToken, clearToken };

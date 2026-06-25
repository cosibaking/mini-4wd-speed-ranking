import { API_BASE } from '../config';
import type { ApiResponse } from '../types';
import { resolveMediaUrlsInData } from '../utils/mediaUrl';
import { resolveLoginCode } from './loginCode';

const TOKEN_KEY = 'token';

let loginPromise: Promise<string> | null = null;

function getToken(): string {
  return (wx.getStorageSync(TOKEN_KEY) as string) || '';
}

function setToken(token: string): void {
  wx.setStorageSync(TOKEN_KEY, token);
}

function clearToken(): void {
  wx.removeStorageSync(TOKEN_KEY);
}

async function doLogin(): Promise<string> {
  const code = await resolveLoginCode();
  const res = await rawRequest<{ token: string }>({
    url: `${API_BASE}/auth/login`,
    method: 'POST',
    data: { code },
    skipAuth: true,
    skipAutoLogin: true,
  });

  setToken(res.token);
  return res.token;
}

interface RawRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  data?: Record<string, unknown>;
  skipAuth?: boolean;
  skipAutoLogin?: boolean;
}

function rawRequest<T>(options: RawRequestOptions): Promise<T> {
  const { url, method = 'GET', data, skipAuth, skipAutoLogin } = options;
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) header['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: method as WechatMiniprogram.RequestOption['method'],
      data,
      header,
      success: (res) => {
        const body = res.data as ApiResponse<T>;
        if (body.code === 0) {
          resolve(resolveMediaUrlsInData(body.data));
          return;
        }
        if (body.code === 40100 && !skipAutoLogin) {
          reject({ needLogin: true, message: body.message });
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

  const exec = () =>
    rawRequest<T>({
      url,
      method,
      data,
      skipAuth: !auth,
    });

  try {
    return await exec();
  } catch (err: unknown) {
    const e = err as { needLogin?: boolean };
    if (e.needLogin) {
      clearToken();
      if (!loginPromise) {
        loginPromise = doLogin().finally(() => {
          loginPromise = null;
        });
      }
      await loginPromise;
      return exec();
    }
    throw err;
  }
}

export function getApiBase(): string {
  return API_BASE;
}

export { getToken, setToken, clearToken };

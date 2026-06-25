import { clearToken, getToken, request, setToken } from './http';
import { resolveLoginCode } from './loginCode';
import { setSessionUser } from '../stores/session';
import type { PublicUserDetail, UserProfile } from '../types';

export class NeedLoginError extends Error {
  constructor(message = '请先登录') {
    super(message);
    this.name = 'NeedLoginError';
  }
}

/** 用户主动触发：微信原生 wx.login 登录 */
export async function login(): Promise<{ token: string; user: UserProfile }> {
  const code = await resolveLoginCode();
  const result = await request<{ token: string; user: UserProfile }>('/auth/login', {
    method: 'POST',
    data: { code },
    auth: false,
  });
  setToken(result.token);
  setSessionUser(result.user);
  return result;
}

export function getMe(): Promise<UserProfile> {
  return request<UserProfile>('/users/me');
}

export function getUser(id: string): Promise<PublicUserDetail> {
  return request<PublicUserDetail>(`/users/${id}`);
}

export function updateMe(data: { nickName?: string; avatarUrl?: string; bio?: string }): Promise<UserProfile> {
  return request<UserProfile>('/users/me', { method: 'PATCH', data });
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/** 要求已登录，未登录则抛出 NeedLoginError */
export async function requireLogin(): Promise<UserProfile> {
  if (!isLoggedIn()) {
    throw new NeedLoginError();
  }
  const user = await getMe();
  setSessionUser(user);
  return user;
}

/** @deprecated 请使用 requireLogin() 或 login() */
export const ensureLogin = requireLogin;

/** 刷新当前用户资料（如管理权限变更后） */
export async function refreshUser(): Promise<UserProfile | null> {
  if (!isLoggedIn()) {
    setSessionUser(null);
    return null;
  }
  try {
    const user = await getMe();
    setSessionUser(user);
    return user;
  } catch {
    clearToken();
    setSessionUser(null);
    return null;
  }
}

/** 获取用户昵称头像（需用户主动授权） */
export function getUserProfile(): Promise<WechatMiniprogram.UserInfo> {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于展示个人资料',
      success: (res) => resolve(res.userInfo),
      fail: reject,
    });
  });
}

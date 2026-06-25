import { getToken, request, setToken } from './http';
import { resolveLoginCode } from './loginCode';
import { setSessionUser } from '../stores/session';
import type { PublicUserDetail, UserProfile } from '../types';

export async function login(): Promise<{ token: string; user: UserProfile }> {
  const code = await resolveLoginCode();
  return request('/auth/login', { method: 'POST', data: { code }, auth: false });
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

/** 确保已登录，未登录则触发微信登录 */
export async function ensureLogin(): Promise<UserProfile> {
  try {
    const user = await getMe();
    setSessionUser(user);
    return user;
  } catch {
    const result = await login();
    setToken(result.token);
    setSessionUser(result.user);
    return result.user;
  }
}

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
    setSessionUser(null);
    return null;
  }
}

/** 获取用户昵称头像（首次授权） */
export function getUserProfile(): Promise<WechatMiniprogram.UserInfo> {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于展示个人资料',
      success: (res) => resolve(res.userInfo),
      fail: reject,
    });
  });
}

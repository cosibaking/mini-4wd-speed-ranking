import { request } from './http';
import type { UserProfile } from '../types';

export async function login(): Promise<{ token: string; user: UserProfile }> {
  const { code } = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>(
    (resolve, reject) => wx.login({ success: resolve, fail: reject })
  );
  return request('/auth/login', { method: 'POST', data: { code }, auth: false });
}

export function getMe(): Promise<UserProfile> {
  return request<UserProfile>('/users/me');
}

export function updateMe(data: { nickName?: string; avatarUrl?: string }): Promise<UserProfile> {
  return request<UserProfile>('/users/me', { method: 'PATCH', data });
}

/** 确保已登录，未登录则触发微信登录 */
export async function ensureLogin(): Promise<UserProfile> {
  try {
    return await getMe();
  } catch {
    const result = await login();
    return result.user;
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

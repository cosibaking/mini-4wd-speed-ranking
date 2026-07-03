import { request } from './http';
import type { OrganizerApplicationBrief } from '../types';

export interface SubmitOrganizerApplicationDto {
  realName: string;
  idCardNumber: string;
  phone: string;
  wechat?: string;
}

export function getMyOrganizerApplication(): Promise<OrganizerApplicationBrief | null> {
  return request<OrganizerApplicationBrief | null>('/organizer/application');
}

export function verifyOrganizerRealName(data: {
  realName: string;
  idCardNumber: string;
  code: string;
}): Promise<{ verified: true }> {
  return request('/organizer/verify-realname', { method: 'POST', data });
}

export function submitOrganizerApplication(
  data: SubmitOrganizerApplicationDto,
): Promise<OrganizerApplicationBrief> {
  return request('/organizer/apply', {
    method: 'POST',
    data: { ...data },
  });
}

/** 微信城市服务实名校验小程序 */
export const CITY_SERVICE_APP_ID = 'wx308bd2aeb83d3345';
export const CITY_SERVICE_AUTH_PATH = 'subPages/city/wxpay-auth/main';

/** 开发环境 mock 实名校验时使用的 code，须与服务端 WECHAT_REALNAME_MOCK 配合 */
export const MOCK_REALNAME_CODE = 'mock_realname_dev';

export function launchRealNameAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.navigateToMiniProgram({
      appId: CITY_SERVICE_APP_ID,
      path: CITY_SERVICE_AUTH_PATH,
      success: () => resolve(),
      fail: (err) => reject(new Error(err.errMsg || '无法打开实名校验')),
    });
  });
}

export function extractRealNameCode(): string | null {
  const options = wx.getEnterOptionsSync();
  if (options.scene !== 1038) {
    return null;
  }
  const referrer = options.referrerInfo;
  if (!referrer || referrer.appId !== CITY_SERVICE_APP_ID) {
    return null;
  }
  const extra = referrer.extraData as { code?: string } | undefined;
  return extra?.code?.trim() || null;
}

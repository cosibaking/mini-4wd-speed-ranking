import { config } from '../../config/index.js';
import { InternalError, ValidationError } from '../../shared/errors.js';

export interface WechatSession {
  openId: string;
  unionId?: string;
  sessionKey?: string;
}

interface WechatApiResponse {
  openid?: string;
  unionid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

interface AccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
}

interface CheckRealNameResponse {
  errcode?: number;
  errmsg?: string;
  verify_openid?: string;
  verify_real_name?: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export class WechatClient {
  async code2Session(code: string): Promise<WechatSession> {
    if (!code || code.trim() === '') {
      throw new ValidationError('登录凭证无效，请重试');
    }

    if (config.wechat.mock) {
      const openId = `mock_${code.trim()}`;
      return { openId };
    }

    if (!config.wechat.appId || !config.wechat.appSecret) {
      throw new InternalError('微信服务暂不可用');
    }

    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.searchParams.set('appid', config.wechat.appId);
    url.searchParams.set('secret', config.wechat.appSecret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    let payload: WechatApiResponse;
    try {
      const response = await fetch(url.toString());
      payload = (await response.json()) as WechatApiResponse;
    } catch {
      throw new InternalError('微信服务暂不可用');
    }

    if (payload.errcode || !payload.openid) {
      const errcode = payload.errcode ?? 'unknown';
      const errmsg = payload.errmsg ?? 'unknown';
      console.error(`[wechat] code2Session failed errcode=${errcode} errmsg=${errmsg}`);
      if (errcode === 40013 || errcode === 40125) {
        throw new ValidationError('小程序 AppID 或 AppSecret 配置错误，请检查服务端 WECHAT_APP_ID / WECHAT_APP_SECRET');
      }
      if (errcode === 40029 || errcode === 40163) {
        throw new ValidationError('登录凭证已失效，请重新点击登录');
      }
      throw new ValidationError('微信登录失败，请重试');
    }

    return {
      openId: payload.openid,
      unionId: payload.unionid,
      sessionKey: payload.session_key,
    };
  }

  async getAccessToken(): Promise<string> {
    if (config.wechat.mock || config.wechat.realNameMock) {
      return 'mock_access_token';
    }

    if (!config.wechat.appId || !config.wechat.appSecret) {
      throw new InternalError('微信服务暂不可用');
    }

    const now = Date.now();
    if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
      return cachedAccessToken.token;
    }

    const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
    url.searchParams.set('grant_type', 'client_credential');
    url.searchParams.set('appid', config.wechat.appId);
    url.searchParams.set('secret', config.wechat.appSecret);

    let payload: AccessTokenResponse;
    try {
      const response = await fetch(url.toString());
      payload = (await response.json()) as AccessTokenResponse;
    } catch {
      throw new InternalError('微信服务暂不可用');
    }

    if (payload.errcode || !payload.access_token) {
      throw new InternalError(payload.errmsg ?? '获取 access_token 失败');
    }

    cachedAccessToken = {
      token: payload.access_token,
      expiresAt: now + (payload.expires_in ?? 7200) * 1000,
    };

    return payload.access_token;
  }

  async checkRealNameInfo(params: {
    openId: string;
    realName: string;
    credId: string;
    code: string;
  }): Promise<void> {
    if (config.wechat.mock || config.wechat.realNameMock) {
      if (!params.realName.trim() || !params.credId.trim() || !params.code.trim()) {
        throw new ValidationError('实名信息不完整');
      }
      return;
    }

    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/intp/realname/checkrealnameinfo?access_token=${accessToken}`;

    let payload: CheckRealNameResponse;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openid: params.openId,
          real_name: params.realName,
          cred_id: params.credId,
          cred_type: 1,
          code: params.code,
        }),
      });
      payload = (await response.json()) as CheckRealNameResponse;
    } catch {
      throw new InternalError('实名校验服务暂不可用');
    }

    if (payload.errcode !== 0) {
      throw new ValidationError(payload.errmsg ?? '实名信息校验未通过');
    }
  }
}

export const wechatClient = new WechatClient();

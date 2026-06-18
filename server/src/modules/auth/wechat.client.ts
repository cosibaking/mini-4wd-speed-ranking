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
      throw new ValidationError('登录凭证无效，请重试');
    }

    return {
      openId: payload.openid,
      unionId: payload.unionid,
      sessionKey: payload.session_key,
    };
  }
}

export const wechatClient = new WechatClient();

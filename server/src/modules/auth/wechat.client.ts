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

interface GetPhoneNumberResponse {
  errcode?: number;
  errmsg?: string;
  phone_info?: {
    phoneNumber?: string;
    purePhoneNumber?: string;
    countryCode?: string;
  };
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/** 从 Node fetch 抛出的错误里挖出底层原因（ENOTFOUND / ETIMEDOUT / ECONNREFUSED 等） */
function describeFetchError(error: unknown): string {
  const err = error as { message?: string; cause?: { code?: string; message?: string } };
  const cause = err?.cause;
  const parts = [err?.message ?? String(error)];
  if (cause?.code) parts.push(`code=${cause.code}`);
  if (cause?.message && cause.message !== err?.message) parts.push(cause.message);
  return parts.join(' ');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTlsCertError(error: unknown): boolean {
  const err = error as { cause?: { code?: string }; message?: string };
  const code = err?.cause?.code ?? '';
  const msg = `${err?.message ?? ''} ${err?.cause?.code ?? ''}`;
  return code.includes('CERT') || code.includes('SELF_SIGNED') || /self-signed certificate|CERT_/i.test(msg);
}

// 一旦探测到云托管内部网关的自签证书，后续请求直接走 http，省去无谓的 https 失败重试。
let wechatPreferHttp = false;

/**
 * 调用微信开放接口，带重试与 http 回退。
 * 微信云托管把 api.weixin.qq.com 路由到内部网关（免公网流量/免鉴权），
 * 但该网关对 https 使用自签证书；遇到证书错误时自动回退到 http 内部通道。
 */
async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit | undefined,
  attempts = 3,
): Promise<T> {
  const httpsUrl = url;
  const httpUrl = url.replace(/^https:\/\//, 'http://');
  const hasHttpFallback = httpUrl !== httpsUrl;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    const target = wechatPreferHttp && hasHttpFallback ? httpUrl : httpsUrl;
    try {
      const response = await fetch(target, init);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      console.error(
        `[wechat] fetch 第 ${i + 1}/${attempts} 次失败 scheme=${target.split(':')[0]}: ${describeFetchError(error)}`,
      );
      if (isTlsCertError(error) && hasHttpFallback) {
        wechatPreferHttp = true;
      }
      if (i < attempts - 1) {
        await sleep(300 * (i + 1));
      }
    }
  }
  throw lastError;
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
      console.error(
        `[wechat] code2Session 缺少配置 appIdSet=${Boolean(config.wechat.appId)} secretSet=${Boolean(config.wechat.appSecret)}`
      );
      throw new InternalError(
        `微信服务暂不可用[诊断:配置缺失 appId=${Boolean(config.wechat.appId)} secret=${Boolean(config.wechat.appSecret)}]`
      );
    }

    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.searchParams.set('appid', config.wechat.appId);
    url.searchParams.set('secret', config.wechat.appSecret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    let payload: WechatApiResponse;
    try {
      payload = await fetchJsonWithRetry<WechatApiResponse>(url.toString(), undefined);
    } catch (error) {
      const detail = describeFetchError(error);
      console.error(`[wechat] code2Session fetch 网络异常(已重试): ${detail}`);
      throw new InternalError(`微信服务暂不可用[诊断:网络异常 ${detail}]`);
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

  /**
   * 用小程序 getPhoneNumber 按钮返回的 code 换取用户手机号。
   * mock 模式下返回固定测试号码，便于开发调试。
   */
  async getPhoneNumber(code: string): Promise<string> {
    if (!code || code.trim() === '') {
      throw new ValidationError('手机号凭证无效，请重试');
    }

    if (config.wechat.mock || config.wechat.realNameMock) {
      return '13800000000';
    }

    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;

    let payload: GetPhoneNumberResponse;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      payload = (await response.json()) as GetPhoneNumberResponse;
    } catch {
      throw new InternalError('微信手机号服务暂不可用');
    }

    const phone = payload.phone_info?.purePhoneNumber ?? payload.phone_info?.phoneNumber;
    if (payload.errcode || !phone) {
      throw new ValidationError(payload.errmsg ?? '获取微信手机号失败');
    }

    return phone;
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

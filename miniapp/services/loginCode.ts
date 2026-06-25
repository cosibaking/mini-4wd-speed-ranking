import { MOCK_LOGIN_CODE } from '../config';
import { getClientConfig } from './clientConfig';

/** 解析微信登录 code：仅当服务端开启 WECHAT_MOCK 时使用固定 mock code */
export async function resolveLoginCode(): Promise<string> {
  try {
    const clientConfig = await getClientConfig();
    if (clientConfig.wechatMock) {
      const mockCode = clientConfig.mockLoginCode || MOCK_LOGIN_CODE;
      if (mockCode) {
        return mockCode;
      }
    }
  } catch {
    // ignore
  }

  const { code } = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>(
    (resolve, reject) => wx.login({ success: resolve, fail: reject }),
  );
  return code;
}

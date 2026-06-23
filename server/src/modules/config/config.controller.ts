import type { HttpContext } from '../../lib/http/index.js';

import { config } from '../../config/index.js';
import { success } from '../../shared/response.js';

/** 小程序启动时可拉取的公开配置（不含密钥） */
export async function getClientConfig(ctx: HttpContext): Promise<void> {
  ctx.body = success({
    realNameMock: config.wechat.realNameMock,
    wechatMock: config.wechat.mock,
    mockLoginCode: config.wechat.mockLoginCode || undefined,
  });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLoginCode = resolveLoginCode;
const config_1 = require("../config");
const clientConfig_1 = require("./clientConfig");
/** 解析微信登录 code：仅当服务端开启 WECHAT_MOCK 时使用固定 mock code */
async function resolveLoginCode() {
    try {
        const clientConfig = await (0, clientConfig_1.getClientConfig)();
        if (clientConfig.wechatMock) {
            const mockCode = clientConfig.mockLoginCode || config_1.MOCK_LOGIN_CODE;
            if (mockCode) {
                return mockCode;
            }
        }
    }
    catch (_a) {
        // ignore
    }
    const { code } = await new Promise((resolve, reject) => wx.login({ success: resolve, fail: reject }));
    return code;
}

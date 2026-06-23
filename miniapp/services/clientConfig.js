"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientConfig = getClientConfig;
exports.isRealNameMockEnabled = isRealNameMockEnabled;
const config_1 = require("../config");
const http_1 = require("./http");
let cachedConfig = null;
async function getClientConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    try {
        const config = await (0, http_1.request)('/config/client', { auth: false });
        cachedConfig = config;
        return config;
    }
    catch (_a) {
        cachedConfig = { realNameMock: config_1.MOCK_REALNAME_VERIFY };
        return cachedConfig;
    }
}
function isRealNameMockEnabled(config) {
    return config.realNameMock || config_1.MOCK_REALNAME_VERIFY;
}

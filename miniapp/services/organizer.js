"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_REALNAME_CODE = exports.CITY_SERVICE_AUTH_PATH = exports.CITY_SERVICE_APP_ID = void 0;
exports.getMyOrganizerApplication = getMyOrganizerApplication;
exports.verifyOrganizerRealName = verifyOrganizerRealName;
exports.submitOrganizerApplication = submitOrganizerApplication;
exports.launchRealNameAuth = launchRealNameAuth;
exports.extractRealNameCode = extractRealNameCode;
const http_1 = require("./http");
function getMyOrganizerApplication() {
    return (0, http_1.request)('/organizer/application');
}
function verifyOrganizerRealName(data) {
    return (0, http_1.request)('/organizer/verify-realname', { method: 'POST', data });
}
function submitOrganizerApplication(data) {
    return (0, http_1.request)('/organizer/apply', {
        method: 'POST',
        data: { ...data },
    });
}
/** 微信城市服务实名校验小程序 */
exports.CITY_SERVICE_APP_ID = 'wx308bd2aeb83d3345';
exports.CITY_SERVICE_AUTH_PATH = 'subPages/city/wxpay-auth/main';
/** 开发环境 mock 实名校验时使用的 code，须与服务端 WECHAT_REALNAME_MOCK 配合 */
exports.MOCK_REALNAME_CODE = 'mock_realname_dev';
function launchRealNameAuth() {
    return new Promise((resolve, reject) => {
        wx.navigateToMiniProgram({
            appId: exports.CITY_SERVICE_APP_ID,
            path: exports.CITY_SERVICE_AUTH_PATH,
            success: () => resolve(),
            fail: (err) => reject(new Error(err.errMsg || '无法打开实名校验')),
        });
    });
}
function extractRealNameCode() {
    var _a;
    const options = wx.getEnterOptionsSync();
    if (options.scene !== 1038) {
        return null;
    }
    const referrer = options.referrerInfo;
    if (!referrer || referrer.appId !== exports.CITY_SERVICE_APP_ID) {
        return null;
    }
    const extra = referrer.extraData;
    return ((_a = extra === null || extra === void 0 ? void 0 : extra.code) === null || _a === void 0 ? void 0 : _a.trim()) || null;
}

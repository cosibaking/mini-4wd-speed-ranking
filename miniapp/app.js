"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("./services/auth");
const config_1 = require("./config");
async function restoreSession() {
    await (0, auth_1.refreshUser)();
}
function initPrivacyAuthorization(app) {
    if (typeof wx.onNeedPrivacyAuthorization !== 'function')
        return;
    wx.onNeedPrivacyAuthorization((resolve) => {
        app.globalData.resolvePrivacyAuthorization = resolve;
        const popup = app.globalData.privacyPopup;
        if (popup === null || popup === void 0 ? void 0 : popup.show) {
            popup.show();
            return;
        }
        // 组件尚未挂载时，微信会降级展示官方隐私弹窗
    });
}
App({
    globalData: {
        user: null,
        apiBase: config_1.API_BASE,
        privacyPopup: null,
        resolvePrivacyAuthorization: null,
    },
    onLaunch() {
        initPrivacyAuthorization(this);
        restoreSession();
    },
});

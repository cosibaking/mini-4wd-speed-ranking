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
        if (config_1.USE_CLOUD_CONTAINER) {
            wx.cloud.init({ env: config_1.CLOUD_ENV, traceUser: true });
        }
        initPrivacyAuthorization(this);
        restoreSession();
    },
});

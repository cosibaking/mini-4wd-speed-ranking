"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("./services/auth");
const config_1 = require("./config");
const session_1 = require("./stores/session");
async function restoreSession() {
    try {
        const user = await (0, auth_1.getMe)();
        (0, session_1.setSessionUser)(user);
    }
    catch (_a) {
        (0, session_1.setSessionUser)(null);
    }
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
        initPrivacyAuthorization(this);
        restoreSession();
    },
});

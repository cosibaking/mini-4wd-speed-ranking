"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PENDING_LEADERBOARD_TRACK_KEY = void 0;
exports.navigateWithLogin = navigateWithLogin;
exports.switchToLeaderboard = switchToLeaderboard;
exports.ensureLoginForTab = ensureLoginForTab;
const auth_1 = require("../services/auth");
const session_1 = require("../stores/session");
function showLoginConfirm() {
    return new Promise((resolve) => {
        wx.showModal({
            title: '需要登录',
            content: '继续操作需使用当前微信账号登录',
            confirmText: '微信登录',
            cancelText: '取消',
            success: (res) => resolve(res.confirm),
            fail: () => resolve(false),
        });
    });
}
function navigateToAsync(url) {
    return new Promise((resolve, reject) => {
        wx.navigateTo({ url, success: () => resolve(), fail: reject });
    });
}
function switchTabAsync(url) {
    return new Promise((resolve, reject) => {
        wx.switchTab({ url, success: () => resolve(), fail: reject });
    });
}
function showLoginError(message) {
    wx.showModal({
        title: '登录失败',
        content: message || '微信登录未成功，请检查网络后重试',
        showCancel: false,
    });
}
/** 确保已登录后再跳转页面 */
async function navigateWithLogin(url, options) {
    var _a;
    const mode = (_a = options === null || options === void 0 ? void 0 : options.mode) !== null && _a !== void 0 ? _a : 'navigate';
    const needLogin = !(0, auth_1.isLoggedIn)();
    if (needLogin) {
        const confirmed = await showLoginConfirm();
        if (!confirmed)
            return false;
    }
    wx.showLoading({ title: '登录中...', mask: true });
    try {
        const user = await (0, auth_1.ensureLogin)();
        (0, session_1.setSessionUser)(user);
        if (mode === 'switchTab') {
            await switchTabAsync(url);
        }
        else {
            await navigateToAsync(url);
        }
        return true;
    }
    catch (err) {
        const message = err instanceof Error ? err.message : undefined;
        showLoginError(message);
        return false;
    }
    finally {
        wx.hideLoading();
    }
}
exports.PENDING_LEADERBOARD_TRACK_KEY = 'pending_leaderboard_track_id';
/** 切换到圈速榜 Tab 并定位到指定赛道 */
function switchToLeaderboard(trackId) {
    wx.setStorageSync(exports.PENDING_LEADERBOARD_TRACK_KEY, trackId);
    wx.switchTab({ url: '/pages/leaderboard/index' });
}
/** 底部 Tab 切换时确保已登录（Tab 会先切换，登录失败则返回首页） */
function ensureLoginForTab() {
    if (!(0, auth_1.isLoggedIn)()) {
        wx.showLoading({ title: '登录中...', mask: true });
    }
    (0, auth_1.ensureLogin)()
        .then((user) => {
        (0, session_1.setSessionUser)(user);
    })
        .catch((err) => {
        wx.switchTab({ url: '/pages/index/index' });
        const message = err instanceof Error ? err.message : undefined;
        showLoginError(message);
    })
        .finally(() => {
        wx.hideLoading();
    });
}

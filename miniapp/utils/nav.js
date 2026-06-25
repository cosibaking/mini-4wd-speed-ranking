"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PENDING_LEADERBOARD_TRACK_KEY = void 0;
exports.redirectToLogin = redirectToLogin;
exports.guardLogin = guardLogin;
exports.navigateWithLogin = navigateWithLogin;
exports.switchToLeaderboard = switchToLeaderboard;
const auth_1 = require("../services/auth");
const session_1 = require("../stores/session");
function showLoginConfirm() {
    return new Promise((resolve) => {
        wx.showModal({
            title: '需要登录',
            content: '继续操作需使用当前微信账号登录',
            confirmText: '去登录',
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
/** 未登录时引导用户前往「我的」页登录 */
function redirectToLogin(message) {
    wx.showModal({
        title: '需要登录',
        content: message !== null && message !== void 0 ? message : '请先登录后再继续',
        confirmText: '去登录',
        cancelText: '返回',
        success: (res) => {
            if (res.confirm) {
                wx.switchTab({ url: '/pages/user/index' });
                return;
            }
            const pages = getCurrentPages();
            if (pages.length > 1) {
                wx.navigateBack();
            }
            else {
                wx.switchTab({ url: '/pages/index/index' });
            }
        },
    });
}
/** 页面进入前检查登录，未登录则弹窗引导 */
async function guardLogin(message) {
    if ((0, auth_1.isLoggedIn)()) {
        try {
            await (0, auth_1.requireLogin)();
            return true;
        }
        catch (_a) {
            // token 失效，继续走引导登录
        }
    }
    redirectToLogin(message);
    return false;
}
/** 已登录时跳转页面；未登录则引导至「我的」页登录 */
async function navigateWithLogin(url, options) {
    var _a;
    const mode = (_a = options === null || options === void 0 ? void 0 : options.mode) !== null && _a !== void 0 ? _a : 'navigate';
    if (!(0, auth_1.isLoggedIn)()) {
        const confirmed = await showLoginConfirm();
        if (!confirmed)
            return false;
        wx.switchTab({ url: '/pages/user/index' });
        return false;
    }
    wx.showLoading({ title: '加载中...', mask: true });
    try {
        const user = await (0, auth_1.requireLogin)();
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
        redirectToLogin(message);
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

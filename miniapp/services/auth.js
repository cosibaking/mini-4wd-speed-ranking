"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.isLoggedIn = isLoggedIn;
exports.ensureLogin = ensureLogin;
exports.refreshUser = refreshUser;
exports.getUserProfile = getUserProfile;
const http_1 = require("./http");
const clientConfig_1 = require("./clientConfig");
const config_1 = require("../config");
const session_1 = require("../stores/session");
async function resolveLoginCode() {
    try {
        const clientConfig = await (0, clientConfig_1.getClientConfig)();
        if (clientConfig.wechatMock && clientConfig.mockLoginCode) {
            return clientConfig.mockLoginCode;
        }
    }
    catch (_a) {
        // ignore
    }
    if (config_1.MOCK_LOGIN_CODE) {
        return config_1.MOCK_LOGIN_CODE;
    }
    const { code } = await new Promise((resolve, reject) => wx.login({ success: resolve, fail: reject }));
    return code;
}
async function login() {
    const code = await resolveLoginCode();
    return (0, http_1.request)('/auth/login', { method: 'POST', data: { code }, auth: false });
}
function getMe() {
    return (0, http_1.request)('/users/me');
}
function updateMe(data) {
    return (0, http_1.request)('/users/me', { method: 'PATCH', data });
}
function isLoggedIn() {
    return !!(0, http_1.getToken)();
}
/** 确保已登录，未登录则触发微信登录 */
async function ensureLogin() {
    try {
        const user = await getMe();
        (0, session_1.setSessionUser)(user);
        return user;
    }
    catch (_a) {
        const result = await login();
        (0, http_1.setToken)(result.token);
        (0, session_1.setSessionUser)(result.user);
        return result.user;
    }
}
/** 刷新当前用户资料（如管理权限变更后） */
async function refreshUser() {
    if (!isLoggedIn()) {
        (0, session_1.setSessionUser)(null);
        return null;
    }
    try {
        const user = await getMe();
        (0, session_1.setSessionUser)(user);
        return user;
    }
    catch (_a) {
        (0, session_1.setSessionUser)(null);
        return null;
    }
}
/** 获取用户昵称头像（首次授权） */
function getUserProfile() {
    return new Promise((resolve, reject) => {
        wx.getUserProfile({
            desc: '用于展示个人资料',
            success: (res) => resolve(res.userInfo),
            fail: reject,
        });
    });
}

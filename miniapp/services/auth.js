"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureLogin = exports.NeedLoginError = void 0;
exports.login = login;
exports.getMe = getMe;
exports.getUser = getUser;
exports.updateMe = updateMe;
exports.getWechatPhoneNumber = getWechatPhoneNumber;
exports.isLoggedIn = isLoggedIn;
exports.logout = logout;
exports.requireLogin = requireLogin;
exports.refreshUser = refreshUser;
exports.getUserProfile = getUserProfile;
const http_1 = require("./http");
const loginCode_1 = require("./loginCode");
const session_1 = require("../stores/session");
class NeedLoginError extends Error {
    constructor(message = '请先登录') {
        super(message);
        this.name = 'NeedLoginError';
    }
}
exports.NeedLoginError = NeedLoginError;
async function login() {
    const code = await (0, loginCode_1.resolveLoginCode)();
    const result = await (0, http_1.request)('/auth/login', {
        method: 'POST',
        data: { code },
        auth: false,
    });
    (0, http_1.setToken)(result.token);
    (0, session_1.setSessionUser)(result.user);
    return result;
}
function getMe() {
    return (0, http_1.request)('/users/me');
}
function getUser(id) {
    return (0, http_1.request)(`/users/${id}`);
}
function updateMe(data) {
    return (0, http_1.request)('/users/me/update', { method: 'POST', data });
}
function getWechatPhoneNumber(code) {
    return (0, http_1.request)('/auth/phone', { method: 'POST', data: { code } });
}
function isLoggedIn() {
    return !!(0, http_1.getToken)();
}
function logout() {
    (0, http_1.clearToken)();
    (0, session_1.setSessionUser)(null);
}
async function requireLogin() {
    if (!isLoggedIn()) {
        throw new NeedLoginError();
    }
    const user = await getMe();
    (0, session_1.setSessionUser)(user);
    return user;
}
exports.ensureLogin = requireLogin;
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
        (0, http_1.clearToken)();
        (0, session_1.setSessionUser)(null);
        return null;
    }
}
function getUserProfile() {
    return new Promise((resolve, reject) => {
        wx.getUserProfile({
            desc: '用于展示个人资料',
            success: (res) => resolve(res.userInfo),
            fail: reject,
        });
    });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.request = request;
exports.getApiBase = getApiBase;
exports.getToken = getToken;
exports.setToken = setToken;
exports.clearToken = clearToken;
const config_1 = require("../config");
const mediaUrl_1 = require("../utils/mediaUrl");
const TOKEN_KEY = 'token';
let loginPromise = null;
function getToken() {
    return wx.getStorageSync(TOKEN_KEY) || '';
}
function setToken(token) {
    wx.setStorageSync(TOKEN_KEY, token);
}
function clearToken() {
    wx.removeStorageSync(TOKEN_KEY);
}
async function doLogin() {
    const { code } = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject });
    });
    const res = await rawRequest({
        url: `${config_1.API_BASE}/auth/login`,
        method: 'POST',
        data: { code },
        skipAuth: true,
        skipAutoLogin: true,
    });
    setToken(res.token);
    return res.token;
}
function rawRequest(options) {
    const { url, method = 'GET', data, skipAuth, skipAutoLogin } = options;
    const header = {
        'Content-Type': 'application/json',
    };
    if (!skipAuth) {
        const token = getToken();
        if (token)
            header['Authorization'] = `Bearer ${token}`;
    }
    return new Promise((resolve, reject) => {
        wx.request({
            url,
            method: method,
            data,
            header,
            success: (res) => {
                const body = res.data;
                if (body.code === 0) {
                    resolve((0, mediaUrl_1.resolveMediaUrlsInData)(body.data));
                    return;
                }
                if (body.code === 40100 && !skipAutoLogin) {
                    reject({ needLogin: true, message: body.message });
                    return;
                }
                reject(new Error(body.message || '请求失败'));
            },
            fail: (err) => reject(err),
        });
    });
}
async function request(path, options = {}) {
    const { method = 'GET', data, auth = true } = options;
    const url = path.startsWith('http') ? path : `${config_1.API_BASE}${path}`;
    const exec = () => rawRequest({
        url,
        method,
        data,
        skipAuth: !auth,
    });
    try {
        return await exec();
    }
    catch (err) {
        const e = err;
        if (e.needLogin) {
            if (!loginPromise) {
                loginPromise = doLogin().finally(() => {
                    loginPromise = null;
                });
            }
            await loginPromise;
            return exec();
        }
        throw err;
    }
}
function getApiBase() {
    return config_1.API_BASE;
}

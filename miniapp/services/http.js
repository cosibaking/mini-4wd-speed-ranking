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
function getToken() {
    return wx.getStorageSync(TOKEN_KEY) || '';
}
function setToken(token) {
    wx.setStorageSync(TOKEN_KEY, token);
}
function clearToken() {
    wx.removeStorageSync(TOKEN_KEY);
}
function rawRequest(options) {
    const { url, method = 'GET', data, skipAuth } = options;
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
                if (body.code === 40100) {
                    reject(new Error(body.message || '请先登录'));
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
    return rawRequest({
        url,
        method,
        data,
        skipAuth: !auth,
    });
}
function getApiBase() {
    return config_1.API_BASE;
}

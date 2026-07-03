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
function buildHeader(skipAuth) {
    const header = {
        'content-type': 'application/json',
    };
    if (!skipAuth) {
        const token = getToken();
        if (token)
            header['Authorization'] = `Bearer ${token}`;
    }
    return header;
}
function handleBody(raw, resolve, reject) {
    const body = raw;
    if (!body || typeof body !== 'object') {
        reject(new Error('服务器响应异常'));
        return;
    }
    if (body.code === 0) {
        resolve((0, mediaUrl_1.resolveMediaUrlsInData)(body.data));
        return;
    }
    if (body.code === 40100) {
        reject(new Error(body.message || '请先登录'));
        return;
    }
    reject(new Error(body.message || '请求失败'));
}
function sendViaContainer(path, data, header) {
    return new Promise((resolve, reject) => {
        const cloud = wx.cloud;
        cloud.callContainer({
            config: { env: config_1.CLOUD_ENV },
            path: `${config_1.CLOUD_PATH_PREFIX}${path}`,
            method: 'POST',
            header: { ...header, 'X-WX-SERVICE': config_1.CLOUD_SERVICE },
            data,
            success: (res) => handleBody(res.data, resolve, reject),
            fail: (err) => reject(err instanceof Error ? err : new Error('网络请求失败')),
        });
    });
}
function sendViaRequest(url, data, header) {
    return new Promise((resolve, reject) => {
        wx.request({
            url,
            method: 'POST',
            data,
            header,
            success: (res) => handleBody(res.data, resolve, reject),
            fail: (err) => reject(err instanceof Error ? err : new Error('网络请求失败')),
        });
    });
}
function rawRequest(options) {
    const { path, data, skipAuth } = options;
    const header = buildHeader(skipAuth);
    if (config_1.USE_CLOUD_CONTAINER && !path.startsWith('http')) {
        return sendViaContainer(path, data, header);
    }
    const url = path.startsWith('http') ? path : `${config_1.API_BASE}${path}`;
    return sendViaRequest(url, data, header);
}
async function request(path, options = {}) {
    const { data, auth = true } = options;
    return rawRequest({
        path,
        data,
        skipAuth: !auth,
    });
}
function getApiBase() {
    return config_1.API_BASE;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMediaUrl = resolveMediaUrl;
exports.normalizeUrlList = normalizeUrlList;
exports.resolveDisplayImageUrl = resolveDisplayImageUrl;
exports.resolveDisplayImageUrls = resolveDisplayImageUrls;
exports.resolveMediaUrlsInData = resolveMediaUrlsInData;
const config_1 = require("../config");
/** 本地 mock 媒体 URL 中的 127.0.0.1/localhost 在真机上不可达，需替换为 API 同源地址 */
function resolveMediaUrl(url) {
    if (!url || typeof url !== 'string' || !url.includes('/mock-media/')) {
        return url;
    }
    const originMatch = config_1.API_BASE.match(/^(https?:\/\/[^/]+)/);
    if (!originMatch) {
        return url;
    }
    return url.replace(/^https?:\/\/[^/]+/, originMatch[1]);
}
/** 兼容 imageUrls / images 字段，以及误传的单字符串或对象数组 */
function normalizeUrlList(value) {
    var _a;
    if (!value)
        return [];
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? [resolveMediaUrl(trimmed)] : [];
    }
    if (!Array.isArray(value))
        return [];
    const urls = [];
    for (const item of value) {
        if (typeof item === 'string') {
            const trimmed = item.trim();
            if (trimmed)
                urls.push(resolveMediaUrl(trimmed));
            continue;
        }
        if (item && typeof item === 'object') {
            const record = item;
            const raw = (_a = record.imageUrl) !== null && _a !== void 0 ? _a : record.url;
            if (typeof raw === 'string' && raw.trim()) {
                urls.push(resolveMediaUrl(raw.trim()));
            }
        }
    }
    return urls;
}
const displayUrlCache = new Map();
/** 真机调试时 network image 可能无法直接渲染，下载到本地临时路径后展示 */
function resolveDisplayImageUrl(url, force = false) {
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        return Promise.resolve(url);
    }
    const resolved = resolveMediaUrl(url);
    if (!force) {
        const cached = displayUrlCache.get(resolved);
        if (cached)
            return Promise.resolve(cached);
    }
    return new Promise((resolve) => {
        wx.downloadFile({
            url: resolved,
            success(res) {
                if (res.statusCode === 200 && res.tempFilePath) {
                    displayUrlCache.set(resolved, res.tempFilePath);
                    resolve(res.tempFilePath);
                    return;
                }
                resolve(resolved);
            },
            fail() {
                resolve(resolved);
            },
        });
    });
}
async function resolveDisplayImageUrls(urls, force = false) {
    return Promise.all(urls.map((url) => resolveDisplayImageUrl(url, force)));
}
function resolveMediaUrlsInData(data) {
    if (typeof data === 'string') {
        return resolveMediaUrl(data);
    }
    if (Array.isArray(data)) {
        return data.map((item) => resolveMediaUrlsInData(item));
    }
    if (data && typeof data === 'object') {
        const input = data;
        const output = {};
        for (const key of Object.keys(input)) {
            output[key] = resolveMediaUrlsInData(input[key]);
        }
        return output;
    }
    return data;
}

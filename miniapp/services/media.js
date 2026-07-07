"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadCancelledError = void 0;
exports.getUploadCredential = getUploadCredential;
exports.confirmUpload = confirmUpload;
exports.uploadLocalImage = uploadLocalImage;
exports.chooseAndUploadImage = chooseAndUploadImage;
exports.chooseAndUploadVideo = chooseAndUploadVideo;
const http_1 = require("./http");
function logMedia(message, detail) {
    if (detail !== undefined) {
        console.log(`[media] ${message}`, detail);
        return;
    }
    console.log(`[media] ${message}`);
}
function logMediaError(message, error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[media] ${message}`, detail);
}
function getUploadCredential(data) {
    return (0, http_1.request)('/media/upload-credential', { method: 'POST', data });
}
function confirmUpload(objectKey) {
    return (0, http_1.request)('/media/confirm', { method: 'POST', data: { objectKey } });
}
class UploadCancelledError extends Error {
    constructor() {
        super('CANCELLED');
        this.name = 'UploadCancelledError';
    }
}
exports.UploadCancelledError = UploadCancelledError;
/** mock 模式：经服务端 /mock-media/upload 代理写入 */
function isMockProxyUpload(uploadUrl) {
    return uploadUrl.includes('/mock-media/upload/');
}
function uploadViaMockProxy(uploadUrl, objectKey, filePath) {
    logMedia(`upload mock proxy objectKey=${objectKey} url=${uploadUrl}`);
    return new Promise((resolve, reject) => {
        wx.uploadFile({
            url: uploadUrl,
            filePath,
            name: 'file',
            formData: { objectKey },
            header: {
                Authorization: `Bearer ${(0, http_1.getToken)()}`,
            },
            success: (res) => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`mock upload failed: ${res.statusCode}`));
                    return;
                }
                try {
                    const body = JSON.parse(res.data);
                    if (body.code !== undefined && body.code !== 0) {
                        reject(new Error(body.message || 'mock upload failed'));
                        return;
                    }
                }
                catch (_a) {
                    // non-JSON 200 response is acceptable
                }
                logMedia(`upload mock proxy ok objectKey=${objectKey}`);
                resolve();
            },
            fail: (err) => reject(err instanceof Error ? err : new Error('mock upload failed')),
        });
    });
}
/** 本地服务端 /media/upload 代理（兼容旧逻辑） */
function uploadViaLocalServerProxy(objectKey, filePath) {
    const uploadUrl = `${(0, http_1.getApiBase)()}/media/upload`;
    logMedia(`upload local server proxy objectKey=${objectKey} url=${uploadUrl}`);
    return uploadViaMockProxy(uploadUrl, objectKey, filePath);
}
/** 真实 COS：客户端直传预签名 PUT URL */
function uploadViaPresignedPut(uploadUrl, filePath, headers) {
    logMedia(`upload COS presigned PUT url=${uploadUrl.slice(0, 80)}...`);
    return new Promise((resolve, reject) => {
        wx.getFileSystemManager().readFile({
            filePath,
            success: (readRes) => {
                wx.request({
                    url: uploadUrl,
                    method: 'PUT',
                    header: headers,
                    data: readRes.data,
                    success: (res) => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            logMedia(`upload COS presigned PUT ok status=${res.statusCode}`);
                            resolve();
                            return;
                        }
                        reject(new Error(`COS upload failed: ${res.statusCode}`));
                    },
                    fail: (err) => reject(err instanceof Error ? err : new Error('COS upload failed')),
                });
            },
            fail: (err) => reject(err instanceof Error ? err : new Error('read file failed')),
        });
    });
}
async function uploadBinary(uploadUrl, filePath, headers, objectKey) {
    if (isMockProxyUpload(uploadUrl)) {
        await uploadViaMockProxy(uploadUrl, objectKey, filePath);
        return;
    }
    if (uploadUrl.includes('/media/upload') || uploadUrl.includes('/mock-media/')) {
        await uploadViaLocalServerProxy(objectKey, filePath);
        return;
    }
    await uploadViaPresignedPut(uploadUrl, filePath, headers);
}
function inferImageExt(tempFilePath) {
    var _a;
    const ext = (_a = tempFilePath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (ext === 'png')
        return 'png';
    if (ext === 'jpeg')
        return 'jpeg';
    if (ext === 'jpg')
        return 'jpg';
    return 'jpg';
}
function getLocalFileSize(filePath) {
    return new Promise((resolve, reject) => {
        wx.getFileSystemManager().stat({
            path: filePath,
            success: (res) => resolve(res.stats.size),
            fail: reject,
        });
    });
}
async function resolveFileSize(tempFilePath, reportedSize) {
    if (reportedSize > 0) {
        return reportedSize;
    }
    return getLocalFileSize(tempFilePath);
}
/** 上传本地图片文件，返回可入库的媒体地址 */
async function uploadLocalImage(tempFilePath, purpose) {
    logMedia(`uploadLocalImage start purpose=${purpose} path=${tempFilePath}`);
    const fileExt = inferImageExt(tempFilePath);
    const fileSize = await getLocalFileSize(tempFilePath);
    const cred = await getUploadCredential({
        mediaType: 'image',
        purpose,
        fileExt,
        fileSize,
    });
    logMedia(`credential ok objectKey=${cred.objectKey} publicUrl=${cred.publicUrl} uploadUrl=${cred.uploadUrl.slice(0, 80)}...`);
    try {
        await uploadBinary(cred.uploadUrl, tempFilePath, cred.headers, cred.objectKey);
        await confirmUpload(cred.objectKey);
        logMedia(`uploadLocalImage done objectKey=${cred.objectKey} publicUrl=${cred.publicUrl}`);
        return cred.publicUrl;
    }
    catch (error) {
        logMediaError(`uploadLocalImage failed objectKey=${cred.objectKey}`, error);
        throw error;
    }
}
/** 选择并上传图片 */
async function chooseAndUploadImage(purpose, count = 1) {
    const res = await new Promise((resolve, reject) => {
        wx.chooseMedia({
            count,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: (err) => {
                var _a;
                if ((_a = err.errMsg) === null || _a === void 0 ? void 0 : _a.includes('cancel')) {
                    reject(new UploadCancelledError());
                    return;
                }
                reject(err);
            },
        });
    });
    const urls = [];
    for (const file of res.tempFiles) {
        urls.push(await uploadLocalImage(file.tempFilePath, purpose));
    }
    return urls;
}
/** 选择并上传视频 */
async function chooseAndUploadVideo(purpose) {
    const res = await new Promise((resolve, reject) => {
        wx.chooseMedia({
            count: 1,
            mediaType: ['video'],
            sourceType: ['album', 'camera'],
            maxDuration: 120,
            success: resolve,
            fail: (err) => {
                var _a;
                if ((_a = err.errMsg) === null || _a === void 0 ? void 0 : _a.includes('cancel')) {
                    reject(new UploadCancelledError());
                    return;
                }
                reject(err);
            },
        });
    });
    const file = res.tempFiles[0];
    const fileSize = await resolveFileSize(file.tempFilePath, file.size);
    const cred = await getUploadCredential({
        mediaType: 'video',
        purpose,
        fileExt: 'mp4',
        fileSize,
    });
    await uploadBinary(cred.uploadUrl, file.tempFilePath, cred.headers, cred.objectKey);
    await confirmUpload(cred.objectKey);
    return cred.publicUrl;
}

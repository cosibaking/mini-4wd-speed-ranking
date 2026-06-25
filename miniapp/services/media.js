"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadCancelledError = void 0;
exports.getUploadCredential = getUploadCredential;
exports.confirmUpload = confirmUpload;
exports.chooseAndUploadImage = chooseAndUploadImage;
exports.chooseAndUploadVideo = chooseAndUploadVideo;
const http_1 = require("./http");
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
function uploadViaServerApi(objectKey, filePath) {
    return new Promise((resolve, reject) => {
        wx.uploadFile({
            url: `${(0, http_1.getApiBase)()}/media/upload`,
            filePath,
            name: 'file',
            formData: { objectKey },
            header: {
                Authorization: `Bearer ${(0, http_1.getToken)()}`,
            },
            success: (res) => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    reject(new Error(`upload failed: ${res.statusCode}`));
                    return;
                }
                try {
                    const body = JSON.parse(res.data);
                    if (body.code !== undefined && body.code !== 0) {
                        reject(new Error(body.message || 'upload failed'));
                        return;
                    }
                }
                catch (_a) {
                    // non-JSON 200 response is acceptable
                }
                resolve();
            },
            fail: reject,
        });
    });
}
async function uploadBinary(_uploadUrl, filePath, _headers, objectKey) {
    await uploadViaServerApi(objectKey, filePath);
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
        const fileExt = inferImageExt(file.tempFilePath);
        const fileSize = await resolveFileSize(file.tempFilePath, file.size);
        const cred = await getUploadCredential({
            mediaType: 'image',
            purpose,
            fileExt,
            fileSize,
        });
        await uploadBinary(cred.uploadUrl, file.tempFilePath, cred.headers, cred.objectKey);
        await confirmUpload(cred.objectKey);
        urls.push(cred.publicUrl);
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

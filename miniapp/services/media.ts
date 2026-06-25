import { getToken, request, getApiBase } from './http';

export interface UploadCredential {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expireAt: string;
  headers: Record<string, string>;
}

type ImageFileExt = 'jpg' | 'jpeg' | 'png';

export function getUploadCredential(data: {
  mediaType: 'image' | 'video';
  purpose: string;
  fileExt: string;
  fileSize: number;
}): Promise<UploadCredential> {
  return request<UploadCredential>('/media/upload-credential', { method: 'POST', data });
}

export function confirmUpload(objectKey: string): Promise<{ url: string }> {
  return request('/media/confirm', { method: 'POST', data: { objectKey } });
}

export class UploadCancelledError extends Error {
  constructor() {
    super('CANCELLED');
    this.name = 'UploadCancelledError';
  }
}

function uploadViaServerApi(objectKey: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${getApiBase()}/media/upload`,
      filePath,
      name: 'file',
      formData: { objectKey },
      header: {
        Authorization: `Bearer ${getToken()}`,
      },
      success: (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`upload failed: ${res.statusCode}`));
          return;
        }

        try {
          const body = JSON.parse(res.data) as { code?: number; message?: string };
          if (body.code !== undefined && body.code !== 0) {
            reject(new Error(body.message || 'upload failed'));
            return;
          }
        } catch {
          // non-JSON 200 response is acceptable
        }

        resolve();
      },
      fail: reject,
    });
  });
}

async function uploadBinary(
  _uploadUrl: string,
  filePath: string,
  _headers: Record<string, string>,
  objectKey: string
): Promise<void> {
  await uploadViaServerApi(objectKey, filePath);
}

function inferImageExt(tempFilePath: string): ImageFileExt {
  const ext = tempFilePath.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'png';
  if (ext === 'jpeg') return 'jpeg';
  if (ext === 'jpg') return 'jpg';
  return 'jpg';
}

function getLocalFileSize(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().stat({
      path: filePath,
      success: (res) => resolve(res.stats.size),
      fail: reject,
    });
  });
}

async function resolveFileSize(tempFilePath: string, reportedSize: number): Promise<number> {
  if (reportedSize > 0) {
    return reportedSize;
  }
  return getLocalFileSize(tempFilePath);
}

/** 选择并上传图片 */
export async function chooseAndUploadImage(
  purpose: string,
  count = 1
): Promise<string[]> {
  const res = await new Promise<WechatMiniprogram.ChooseMediaSuccessCallbackResult>(
    (resolve, reject) => {
      wx.chooseMedia({
        count,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: (err) => {
          if (err.errMsg?.includes('cancel')) {
            reject(new UploadCancelledError());
            return;
          }
          reject(err);
        },
      });
    }
  );

  const urls: string[] = [];
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
export async function chooseAndUploadVideo(purpose: string): Promise<string> {
  const res = await new Promise<WechatMiniprogram.ChooseMediaSuccessCallbackResult>(
    (resolve, reject) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera'],
        maxDuration: 120,
        success: resolve,
        fail: (err) => {
          if (err.errMsg?.includes('cancel')) {
            reject(new UploadCancelledError());
            return;
          }
          reject(err);
        },
      });
    }
  );

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

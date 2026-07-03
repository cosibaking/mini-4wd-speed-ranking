import { getToken, request, getApiBase } from './http';

export interface UploadCredential {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expireAt: string;
  headers: Record<string, string>;
}

type ImageFileExt = 'jpg' | 'jpeg' | 'png';

function logMedia(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.log(`[media] ${message}`, detail);
    return;
  }
  console.log(`[media] ${message}`);
}

function logMediaError(message: string, error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[media] ${message}`, detail);
}

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

/** mock 模式：经服务端 /mock-media/upload 代理写入 */
function isMockProxyUpload(uploadUrl: string): boolean {
  return uploadUrl.includes('/mock-media/upload/');
}

function uploadViaMockProxy(
  uploadUrl: string,
  objectKey: string,
  filePath: string
): Promise<void> {
  logMedia(`upload mock proxy objectKey=${objectKey} url=${uploadUrl}`);
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: uploadUrl,
      filePath,
      name: 'file',
      formData: { objectKey },
      header: {
        Authorization: `Bearer ${getToken()}`,
      },
      success: (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`mock upload failed: ${res.statusCode}`));
          return;
        }

        try {
          const body = JSON.parse(res.data) as { code?: number; message?: string };
          if (body.code !== undefined && body.code !== 0) {
            reject(new Error(body.message || 'mock upload failed'));
            return;
          }
        } catch {
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
function uploadViaLocalServerProxy(objectKey: string, filePath: string): Promise<void> {
  const uploadUrl = `${getApiBase()}/media/upload`;
  logMedia(`upload local server proxy objectKey=${objectKey} url=${uploadUrl}`);
  return uploadViaMockProxy(uploadUrl, objectKey, filePath);
}

/** 真实 COS：客户端直传预签名 PUT URL */
function uploadViaPresignedPut(
  uploadUrl: string,
  filePath: string,
  headers: Record<string, string>
): Promise<void> {
  logMedia(`upload COS presigned PUT url=${uploadUrl.slice(0, 80)}...`);
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      success: (readRes) => {
        wx.request({
          url: uploadUrl,
          method: 'PUT',
          header: headers,
          data: readRes.data as ArrayBuffer,
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

async function uploadBinary(
  uploadUrl: string,
  filePath: string,
  headers: Record<string, string>,
  objectKey: string
): Promise<void> {
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

/** 上传本地图片文件，返回可入库的媒体地址 */
export async function uploadLocalImage(tempFilePath: string, purpose: string): Promise<string> {
  logMedia(`uploadLocalImage start purpose=${purpose} path=${tempFilePath}`);
  const fileExt = inferImageExt(tempFilePath);
  const fileSize = await getLocalFileSize(tempFilePath);

  const cred = await getUploadCredential({
    mediaType: 'image',
    purpose,
    fileExt,
    fileSize,
  });
  logMedia(
    `credential ok objectKey=${cred.objectKey} publicUrl=${cred.publicUrl} uploadUrl=${cred.uploadUrl.slice(0, 80)}...`
  );

  try {
    await uploadBinary(cred.uploadUrl, tempFilePath, cred.headers, cred.objectKey);
    await confirmUpload(cred.objectKey);
    logMedia(`uploadLocalImage done objectKey=${cred.objectKey} publicUrl=${cred.publicUrl}`);
    return cred.publicUrl;
  } catch (error) {
    logMediaError(`uploadLocalImage failed objectKey=${cred.objectKey}`, error);
    throw error;
  }
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
    urls.push(await uploadLocalImage(file.tempFilePath, purpose));
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

import { request } from './http';

export interface UploadCredential {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expireAt: string;
  headers: Record<string, string>;
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
        fail: reject,
      });
    }
  );

  const urls: string[] = [];
  for (const file of res.tempFiles) {
    const ext = (file.tempFilePath.split('.').pop() || 'jpg').toLowerCase();
    const cred = await getUploadCredential({
      mediaType: 'image',
      purpose,
      fileExt: ext === 'png' ? 'png' : ext === 'jpeg' ? 'jpeg' : 'jpg',
      fileSize: file.size,
    });

    await new Promise<void>((resolve, reject) => {
      wx.uploadFile({
        url: cred.uploadUrl,
        filePath: file.tempFilePath,
        name: 'file',
        header: cred.headers,
        success: () => resolve(),
        fail: reject,
      });
    });

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
        fail: reject,
      });
    }
  );

  const file = res.tempFiles[0];
  const cred = await getUploadCredential({
    mediaType: 'video',
    purpose,
    fileExt: 'mp4',
    fileSize: file.size,
  });

  await new Promise<void>((resolve, reject) => {
    wx.uploadFile({
      url: cred.uploadUrl,
      filePath: file.tempFilePath,
      name: 'file',
      header: cred.headers,
      success: () => resolve(),
      fail: reject,
    });
  });

  await confirmUpload(cred.objectKey);
  return cred.publicUrl;
}

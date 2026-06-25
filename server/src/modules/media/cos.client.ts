import COS from 'cos-nodejs-sdk-v5';

import { InternalError } from '../../shared/errors.js';
import { mockObjectExists } from './mock.handler.js';
import { getContentType } from './policy.validator.js';
import { buildPublicUrl, getMockUploadUrl, isMockMediaEnabled } from './path.builder.js';

const PRESIGN_TTL_SECONDS = 900;

function logCos(message: string): void {
  console.log(`[cos] ${message}`);
}

function logCosError(message: string, error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[cos] ${message} error=${detail}`);
}

interface PresignParams {
  objectKey: string;
  fileSize: number;
  contentType: string;
  mediaHost?: string;
}

interface PresignResult {
  uploadUrl: string;
  expireAt: string;
  headers: Record<string, string>;
}

function buildExpireAt(): string {
  return new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000).toISOString();
}

class MockCosClient {
  presignedPut(params: PresignParams): PresignResult {
    const expireAt = buildExpireAt();
    logCos(
      `presignedPut mock objectKey=${params.objectKey} fileSize=${params.fileSize} contentType=${params.contentType} expireAt=${expireAt}`,
    );
    return {
      uploadUrl: getMockUploadUrl(params.objectKey, params.mediaHost),
      expireAt,
      headers: {
        'Content-Type': params.contentType,
      },
    };
  }

  async headObject(objectKey: string): Promise<{ size: number }> {
    const info = await mockObjectExists(objectKey);
    if (!info || info.size <= 0) {
      logCos(`headObject mock not found objectKey=${objectKey}`);
      throw new Error('object not found');
    }
    logCos(`headObject mock ok objectKey=${objectKey} size=${info.size}`);
    return info;
  }
}

class RealCosClient {
  private sdk: {
    getObjectUrl: (options: Record<string, unknown>) => string;
    headObject: (
      options: Record<string, unknown>,
      callback: (error: Error | null, data?: { headers?: Record<string, string> }) => void,
    ) => void;
  } | null = null;

  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.bucket = process.env.COS_BUCKET ?? '';
    this.region = process.env.COS_REGION ?? '';
  }

  private loadSdk() {
    if (this.sdk) {
      return this.sdk;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const COS = require('cos-nodejs-sdk-v5');
      this.sdk = new COS({
        SecretId: process.env.COS_SECRET_ID,
        SecretKey: process.env.COS_SECRET_KEY,
      });
      return this.sdk;
    } catch (error) {
      logCosError('sdk load failed', error);
      throw new InternalError('COS SDK \u672a\u5b89\u88c5\uff0c\u8bf7\u6dfb\u52a0 cos-nodejs-sdk-v5 \u4f9d\u8d96');
    }
  }

  presignedPut(params: PresignParams): PresignResult {
    const cos = this.loadSdk()!;
    const expireAt = buildExpireAt();
    const uploadUrl = cos.getObjectUrl({
      Bucket: this.bucket,
      Region: this.region,
      Key: params.objectKey,
      Sign: true,
      Method: 'PUT',
      Expires: PRESIGN_TTL_SECONDS,
      Headers: {
        'Content-Type': params.contentType,
        'Content-Length': String(params.fileSize),
      },
    });

    logCos(
      `presignedPut ok bucket=${this.bucket} region=${this.region} objectKey=${params.objectKey} fileSize=${params.fileSize} contentType=${params.contentType} expireAt=${expireAt}`,
    );

    return {
      uploadUrl,
      expireAt,
      headers: {
        'Content-Type': params.contentType,
      },
    };
  }

  async headObject(objectKey: string): Promise<{ size: number }> {
    const cos = this.loadSdk()!;

    return new Promise((resolve, reject) => {
      cos.headObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: objectKey,
        },
        (error, data) => {
          if (error) {
            logCosError(`headObject failed bucket=${this.bucket} objectKey=${objectKey}`, error);
            reject(error);
            return;
          }

          const lengthHeader = data?.headers?.['content-length'];
          const size = lengthHeader ? Number(lengthHeader) : 0;
          logCos(`headObject ok bucket=${this.bucket} objectKey=${objectKey} size=${size}`);
          resolve({ size });
        },
      );
    });
  }
}

let client: MockCosClient | RealCosClient | null = null;

function getCosClient(): MockCosClient | RealCosClient {
  if (client) {
    return client;
  }

  if (isMockMediaEnabled()) {
    logCos('client initialized mode=mock');
    client = new MockCosClient();
  } else {
    const bucket = process.env.COS_BUCKET ?? '';
    const region = process.env.COS_REGION ?? '';
    logCos(`client initialized mode=real bucket=${bucket} region=${region}`);
    client = new RealCosClient();
  }
  return client;
}

export function resetCosClientForTests(): void {
  client = null;
}

export async function createPresignedPut(
  objectKey: string,
  fileExt: string,
  fileSize: number,
  mediaHost?: string,
): Promise<PresignResult> {
  const contentType = getContentType(fileExt as 'jpg' | 'jpeg' | 'png' | 'mp4');
  return getCosClient().presignedPut({ objectKey, fileSize, contentType, mediaHost });
}

export async function verifyObjectExists(objectKey: string): Promise<boolean> {
  try {
    const result = await getCosClient().headObject(objectKey);
    const exists = result.size > 0;
    logCos(`verifyObjectExists objectKey=${objectKey} exists=${exists} size=${result.size}`);
    return exists;
  } catch {
    logCos(`verifyObjectExists objectKey=${objectKey} exists=false`);
    return false;
  }
}

export { buildPublicUrl, isMockMediaEnabled };

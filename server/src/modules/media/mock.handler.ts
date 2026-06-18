import type { IncomingMessage, ServerResponse } from 'node:http';

import { objectExists, readObject, saveObject } from './mock.store.js';
import { parseMultipartBody } from './multipart.util.js';
import { isMockMediaEnabled } from './path.builder.js';
function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function decodeObjectKey(encodedKey: string): string {  return decodeURIComponent(encodedKey);
}

function getContentTypeFromKey(objectKey: string): string {
  const ext = objectKey.split('.').pop()?.toLowerCase() ?? 'jpg';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'mp4') return 'video/mp4';
  return 'application/octet-stream';
}

async function handleUpload(req: IncomingMessage, res: ServerResponse, objectKey: string): Promise<void> {
  const rawBody = await readRequestBody(req);
  const contentType = req.headers['content-type'];
  const normalizedContentType = Array.isArray(contentType) ? contentType[0] : contentType;
  const { file } =
    req.method === 'POST'
      ? parseMultipartBody(rawBody, normalizedContentType)
      : { file: rawBody };

  if (file.length === 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ code: 40001, message: '文件为空', data: null }));
    return;
  }

  await saveObject(objectKey, file);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ code: 0, message: 'ok', data: null }));
}

async function handleServe(res: ServerResponse, objectKey: string): Promise<void> {
  const data = await readObject(objectKey);
  if (!data) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', getContentTypeFromKey(objectKey));
  res.setHeader('Content-Length', data.length);
  res.end(data);
}

export async function handleMockMedia(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
): Promise<void> {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!isMockMediaEnabled()) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const uploadMatch = pathname.match(/^\/mock-media\/upload\/(.+)$/);
  if (uploadMatch && (req.method === 'PUT' || req.method === 'POST')) {
    const objectKey = decodeObjectKey(uploadMatch[1]!);
    await handleUpload(req, res, objectKey);
    return;
  }

  if (req.method === 'GET' && pathname.startsWith('/mock-media/')) {
    const objectKey = decodeURIComponent(pathname.slice('/mock-media/'.length));
    if (objectKey) {
      await handleServe(res, objectKey);
      return;
    }
  }

  res.statusCode = 404;
  res.end('Not Found');
}

export { objectExists as mockObjectExists };

import type { HttpMiddleware } from './types.js';

const ALLOWED_ORIGINS = new Set(['*']);

export const corsMiddleware: HttpMiddleware = async (ctx, next) => {
  const origin = ctx.headers.origin ?? '*';
  if (ALLOWED_ORIGINS.has('*') || ALLOWED_ORIGINS.has(origin)) {
    ctx.res.setHeader('Access-Control-Allow-Origin', origin === undefined ? '*' : origin);
    ctx.res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    ctx.res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    ctx.body = null;
    ctx.res.end();
    return;
  }

  await next();
};

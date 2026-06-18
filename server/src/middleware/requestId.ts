import type { Middleware } from 'koa';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(): Middleware {
  return async (ctx, next) => {
    const incoming = ctx.get('X-Request-Id');
    const requestId = incoming || randomUUID();
    ctx.state.requestId = requestId;
    ctx.set('X-Request-Id', requestId);
    await next();
  };
}

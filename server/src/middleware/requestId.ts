import { randomUUID } from 'node:crypto';

import type { HttpMiddleware } from '../lib/http/index.js';

export function requestIdMiddleware(): HttpMiddleware {
  return async (ctx, next) => {
    ctx.state.requestId = randomUUID();
    await next();
  };
}

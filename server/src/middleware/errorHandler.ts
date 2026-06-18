import type { Middleware } from 'koa';

import { AppError, ErrorCode } from '../shared/errors.js';
import { fail } from '../shared/response.js';

export function errorHandler(): Middleware {
  return async (ctx, next) => {
    try {
      await next();
    } catch (error: unknown) {
      if (error instanceof AppError) {
        ctx.status = error.status;
        ctx.body = fail(error.code, error.message);
        return;
      }

      console.error('[error]', {
        requestId: ctx.state.requestId,
        path: ctx.path,
        error,
      });

      ctx.status = 500;
      ctx.body = fail(ErrorCode.INTERNAL, '服务器错误');
    }
  };
}

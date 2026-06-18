import type { Middleware } from 'koa';

import { authService } from '../modules/auth/auth.service.js';
import { UnauthorizedError } from '../shared/errors.js';

export interface AuthMiddlewareOptions {
  required?: boolean;
}

function parseBearer(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function authMiddleware(required: boolean): Middleware;
export function authMiddleware(options?: AuthMiddlewareOptions): Middleware;
export function authMiddleware(options: AuthMiddlewareOptions | boolean = {}): Middleware {
  const required = typeof options === 'boolean' ? options : (options.required ?? false);

  return async (ctx, next) => {
    const token = parseBearer(ctx.headers.authorization);

    if (!token) {
      if (required) {
        throw new UnauthorizedError();
      }
      ctx.state.auth = null;
      await next();
      return;
    }

    ctx.state.auth = await authService.resolveToken(token);
    await next();
  };
}

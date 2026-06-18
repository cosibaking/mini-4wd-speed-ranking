import type { Context } from 'koa';

import { UnauthorizedError, ValidationError } from '../../shared/errors.js';
import { success } from '../../shared/response.js';
import { authService } from './auth.service.js';
import { userService } from './user.service.js';

function getAuthUserId(ctx: Context): string {
  if (!ctx.state.auth) {
    throw new UnauthorizedError();
  }
  return ctx.state.auth.userId;
}

export async function login(ctx: Context): Promise<void> {
  const body = ctx.request.body as { code?: string } | undefined;
  const code = body?.code;

  if (!code || typeof code !== 'string') {
    throw new ValidationError('登录凭证无效，请重试');
  }

  const result = await authService.loginByWechat(code);
  ctx.body = success(result);
}

export async function refresh(ctx: Context): Promise<void> {
  const userId = getAuthUserId(ctx);
  const result = authService.refreshToken(userId);
  ctx.body = success(result);
}

export async function getMe(ctx: Context): Promise<void> {
  const userId = getAuthUserId(ctx);
  const user = await userService.getProfile(userId);
  ctx.body = success(user);
}

export async function patchMe(ctx: Context): Promise<void> {
  const userId = getAuthUserId(ctx);
  const body = ctx.request.body as { nickName?: string; avatarUrl?: string } | undefined;

  const user = await userService.updateProfile(userId, {
    nickName: body?.nickName,
    avatarUrl: body?.avatarUrl,
  });

  ctx.body = success(user);
}

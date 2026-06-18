import type { Context } from 'koa';

import { ValidationError } from '../../shared/errors.js';
import { parsePagination } from '../../shared/pagination.js';
import { success } from '../../shared/response.js';
import { socialService } from './social.service.js';

export async function toggleLike(ctx: Context): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const body = ctx.request.body as { targetType?: string; targetId?: string };

  if (body.targetType !== 'post' && body.targetType !== 'comment') {
    throw new ValidationError('targetType 无效');
  }

  if (!body.targetId) {
    throw new ValidationError('targetId 必填');
  }

  const data = await socialService.toggleLike(userId, {
    type: body.targetType,
    id: body.targetId,
  });

  ctx.body = success(data);
}

export async function toggleFollow(ctx: Context): Promise<void> {
  const followerId = ctx.state.auth!.userId;
  const body = ctx.request.body as { followeeId?: string };

  if (!body.followeeId) {
    throw new ValidationError('followeeId 必填');
  }

  const data = await socialService.toggleFollow(followerId, body.followeeId);
  ctx.body = success(data);
}

export async function listFollowing(ctx: Context): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const pagination = parsePagination(ctx.query as Record<string, string | undefined>);
  const data = await socialService.listFollowing(userId, pagination);
  ctx.body = success(data);
}

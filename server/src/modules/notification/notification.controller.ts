import type { HttpContext } from '../../lib/http/index.js';
import { parsePagination } from '../../shared/pagination.js';
import { success } from '../../shared/response.js';
import { notificationService } from './notification.service.js';

export async function listNotifications(ctx: HttpContext): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const query = ctx.query as Record<string, string | undefined>;
  const pagination = parsePagination(query);

  const data = await notificationService.list(userId, {
    page: pagination.page,
    pageSize: pagination.pageSize,
    unreadOnly: query.unreadOnly === '1' || query.unreadOnly === 'true',
  });

  ctx.body = success(data);
}

export async function getUnreadCount(ctx: HttpContext): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const data = await notificationService.getUnreadCount(userId);
  ctx.body = success(data);
}

export async function markNotificationRead(ctx: HttpContext): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const data = await notificationService.markRead(userId, ctx.params.id);
  ctx.body = success(data);
}

export async function markAllNotificationsRead(ctx: HttpContext): Promise<void> {
  const userId = ctx.state.auth!.userId;
  const data = await notificationService.markAllRead(userId);
  ctx.body = success(data);
}

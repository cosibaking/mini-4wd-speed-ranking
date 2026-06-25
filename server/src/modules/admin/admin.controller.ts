import type { HttpContext } from '../../lib/http/index.js';

import { UnauthorizedError } from '../../shared/errors.js';
import { parsePagination } from '../../shared/pagination.js';
import { success } from '../../shared/response.js';
import { adminService } from './admin.service.js';
import { validateSendAdminNotification } from './dto/send-notification.validator.js';
import { notificationService } from '../notification/notification.service.js';
import { organizerService } from '../organizer/organizer.service.js';
import { userRepository } from '../auth/user.repository.js';
import type { OrganizerApplicationStatus } from '../../shared/types.js';

function getAuthUserId(ctx: HttpContext): string {
  if (!ctx.state.auth) {
    throw new UnauthorizedError();
  }
  return ctx.state.auth.userId;
}

async function assertAdmin(ctx: HttpContext) {
  const userId = getAuthUserId(ctx);
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError();
  }
  adminService.assertAdmin(user);
  return user;
}

export async function getAdminMe(ctx: HttpContext): Promise<void> {
  const userId = getAuthUserId(ctx);
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError();
  }
  const role = adminService.resolveAdminRole(user);
  ctx.body = success({
    isAdmin: !!role,
    adminRole: role ?? undefined,
  });
}

export async function getDashboard(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const stats = await adminService.getDashboardStats();
  ctx.body = success(stats);
}

export async function listApplications(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const query = ctx.query as { status?: string };
  const pagination = parsePagination(ctx.query as Record<string, unknown>);
  const status = (query.status ?? 'pending') as OrganizerApplicationStatus;
  const result = await organizerService.listApplications(
    status,
    pagination.page,
    pagination.pageSize,
  );
  ctx.body = success(result);
}

export async function approveApplication(ctx: HttpContext): Promise<void> {
  const reviewer = await assertAdmin(ctx);
  const { id } = ctx.params as { id: string };
  const body = ctx.request.body as { reviewNote?: string } | undefined;
  const result = await organizerService.approveApplication(id, reviewer.id, body?.reviewNote);
  ctx.body = success(result);
}

export async function rejectApplication(ctx: HttpContext): Promise<void> {
  const reviewer = await assertAdmin(ctx);
  const { id } = ctx.params as { id: string };
  const body = ctx.request.body as { reviewNote?: string } | undefined;
  const result = await organizerService.rejectApplication(id, reviewer.id, body?.reviewNote);
  ctx.body = success(result);
}

export async function listUsers(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const pagination = parsePagination(ctx.query as Record<string, unknown>);
  const result = await adminService.listUsers(pagination.page, pagination.pageSize);
  ctx.body = success(result);
}

export async function listTracks(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const pagination = parsePagination(ctx.query as Record<string, unknown>);
  const result = await adminService.listTracks(pagination.page, pagination.pageSize);
  ctx.body = success(result);
}

export async function grantOrganizer(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const { userId } = ctx.params as { userId: string };
  const result = await adminService.grantOrganizer(userId);
  ctx.body = success(result);
}

export async function revokeOrganizer(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const { userId } = ctx.params as { userId: string };
  const result = await adminService.revokeOrganizer(userId);
  ctx.body = success(result);
}

export async function grantAdmin(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const { userId } = ctx.params as { userId: string };
  const result = await adminService.grantAdmin(userId);
  ctx.body = success(result);
}

export async function revokeAdmin(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const { userId } = ctx.params as { userId: string };
  const result = await adminService.revokeAdmin(userId);
  ctx.body = success(result);
}

export async function sendNotification(ctx: HttpContext): Promise<void> {
  await assertAdmin(ctx);
  const input = validateSendAdminNotification(ctx.request.body);
  const result = await notificationService.sendAdminMessage(input);
  ctx.body = success(result);
}

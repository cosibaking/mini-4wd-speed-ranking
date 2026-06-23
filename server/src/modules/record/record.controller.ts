import type { HttpContext } from '../../lib/http/index.js';

import { UnauthorizedError } from '../../shared/errors';
import { parsePagination } from '../../shared/pagination';
import { success } from '../../shared/response';
import type { RecordStatus } from './dto/record.types';
import { validateApproveRecordDto, validateRejectRecordDto } from './dto/review-record.validator';
import { validateSubmitRecordDto } from './dto/submit-record.validator';
import { leaderboardService } from './leaderboard.service';
import { recordService } from './record.service';

function getAuthUserId(ctx: HttpContext): string {
  if (!ctx.state.auth) {
    throw new UnauthorizedError();
  }
  return ctx.state.auth.userId;
}

function parseRecordStatus(query: Record<string, unknown>): RecordStatus | undefined {
  const status = query.status;
  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    return status;
  }
  return undefined;
}

export async function submitRecord(ctx: HttpContext): Promise<void> {
  const userId = getAuthUserId(ctx);
  const dto = validateSubmitRecordDto(ctx.request.body);
  const detail = await recordService.submit(userId, dto);
  ctx.body = success(detail);
}

export async function approveRecord(ctx: HttpContext): Promise<void> {
  const userId = getAuthUserId(ctx);
  const { id } = ctx.params as { id: string };
  const dto = validateApproveRecordDto(ctx.request.body);
  const detail = await recordService.approve(id, userId, dto);
  ctx.body = success(detail);
}

export async function rejectRecord(ctx: HttpContext): Promise<void> {
  const userId = getAuthUserId(ctx);
  const { id } = ctx.params as { id: string };
  const dto = validateRejectRecordDto(ctx.request.body);
  const detail = await recordService.reject(id, userId, dto);
  ctx.body = success(detail);
}

export async function getRecordById(ctx: HttpContext): Promise<void> {
  const { id } = ctx.params as { id: string };
  const detail = await recordService.getById(id);
  ctx.body = success(detail);
}

export async function listMyRecords(ctx: HttpContext): Promise<void> {
  const userId = getAuthUserId(ctx);
  const query = parsePagination(ctx.query as Record<string, unknown>);
  const result = await recordService.listByUser(userId, query);
  ctx.body = success(result);
}

export async function getLeaderboard(ctx: HttpContext): Promise<void> {
  const { trackId } = ctx.params as { trackId: string };
  const query = parsePagination(ctx.query as Record<string, unknown>);
  const result = await leaderboardService.getRanking(
    trackId,
    query,
    ctx.state.auth?.userId,
  );
  ctx.body = success(result);
}

export async function getTrackPendingCount(ctx: HttpContext): Promise<void> {
  const userId = getAuthUserId(ctx);
  const { trackId } = ctx.params as { trackId: string };
  const result = await recordService.getPendingCount(trackId, userId);
  ctx.body = success(result);
}

export async function listTrackRecords(ctx: HttpContext): Promise<void> {
  const userId = getAuthUserId(ctx);
  const { trackId } = ctx.params as { trackId: string };
  const rawQuery = ctx.query as Record<string, unknown>;
  const query = parsePagination(rawQuery);
  const status = parseRecordStatus(rawQuery);
  const result = await recordService.listByTrack(trackId, userId, {
    ...query,
    status,
  });
  ctx.body = success(result);
}

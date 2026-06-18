import type { HttpContext } from '../../lib/http/index.js';

import { UnauthorizedError } from '../../shared/errors';
import { parsePagination } from '../../shared/pagination';
import { success } from '../../shared/response';
import { validateSubmitRecordDto } from './dto/submit-record.validator';
import { leaderboardService } from './leaderboard.service';
import { recordService } from './record.service';

function getAuthUserId(ctx: HttpContext): string {
  if (!ctx.state.auth) {
    throw new UnauthorizedError();
  }
  return ctx.state.auth.userId;
}

export async function submitRecord(ctx: HttpContext): Promise<void> {
  const userId = getAuthUserId(ctx);
  const dto = validateSubmitRecordDto(ctx.request.body);
  const detail = await recordService.submit(userId, dto);
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

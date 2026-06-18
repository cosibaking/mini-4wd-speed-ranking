import type { Context } from 'koa';

import { UnauthorizedError } from '../../shared/errors';
import { parsePagination } from '../../shared/pagination';
import { success } from '../../shared/response';
import { recordService } from '../record/record.service';
import {
  parseTrackListQuery,
  validateCreateTrackDto,
  validateUpdateTrackDto,
} from './validators/track.validator';
import { trackService } from './track.service';

function getAuthUserId(ctx: Context): string {
  if (!ctx.state.auth) {
    throw new UnauthorizedError();
  }
  return ctx.state.auth.userId;
}

export async function listTracks(ctx: Context): Promise<void> {
  const query = parseTrackListQuery(ctx.query as Record<string, unknown>);
  const result = await trackService.list(query);
  ctx.body = success(result);
}

export async function getRecentTracks(ctx: Context): Promise<void> {
  const userId = getAuthUserId(ctx);
  const list = await trackService.getRecentVisits(userId);
  ctx.body = success(list);
}

export async function listMyTracks(ctx: Context): Promise<void> {
  const userId = getAuthUserId(ctx);
  const query = parsePagination(ctx.query as Record<string, unknown>);
  const result = await trackService.listByCreator(userId, query);
  ctx.body = success(result);
}

export async function getTrackById(ctx: Context): Promise<void> {
  const { id } = ctx.params as { id: string };
  const detail = await trackService.getById(id, ctx.state.auth?.userId);
  ctx.body = success(detail);
}

export async function createTrack(ctx: Context): Promise<void> {
  const userId = getAuthUserId(ctx);
  const dto = validateCreateTrackDto(ctx.request.body);
  const detail = await trackService.create(userId, dto);
  ctx.body = success(detail);
}

export async function updateTrack(ctx: Context): Promise<void> {
  const userId = getAuthUserId(ctx);
  const { id } = ctx.params as { id: string };
  const dto = validateUpdateTrackDto(ctx.request.body);
  const detail = await trackService.update(id, userId, dto);
  ctx.body = success(detail);
}

export async function listTrackRecords(ctx: Context): Promise<void> {
  const userId = getAuthUserId(ctx);
  const { trackId } = ctx.params as { trackId: string };
  const query = parsePagination(ctx.query as Record<string, unknown>);
  const result = await recordService.listByTrack(trackId, userId, query);
  ctx.body = success(result);
}

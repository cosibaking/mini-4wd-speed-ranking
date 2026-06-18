import { prisma } from '../../lib/prisma';
import { parseLapTime } from '../../shared/lapTime';
import { buildPaginationResult, getSkip } from '../../shared/pagination';
import type { PaginationQuery, PaginationResult } from '../../shared/types';
import { trackRepository } from '../track/track.repository';
import { trackService } from '../track/track.service';
import { bestRecordRepository } from './bestRecord.repository';
import type {
  RecordBrief,
  RecordDetail,
  SubmitRecordDto,
} from './dto/record.types';
import {
  forbiddenViewRecordsError,
  invalidLapTimeError,
  recordNotFoundError,
  trackNotFoundForRecordError,
} from './errors';
import { leaderboardService } from './leaderboard.service';
import { recordRepository, type RecordRow } from './record.repository';

function mapConfigSheet(row: RecordRow): RecordDetail['configSheet'] {
  if (row.configSheetType === 'text' && row.configSheetText) {
    return { type: 'text', content: row.configSheetText };
  }
  if (row.configSheetType === 'image' && row.configSheetUrl) {
    return { type: 'image', url: row.configSheetUrl };
  }
  return undefined;
}

function toRecordDetail(
  row: RecordRow,
  rank?: number,
  isBestRecord = true,
): RecordDetail {
  return {
    id: row.id,
    trackId: row.trackId,
    trackName: row.track?.name,
    track: row.track ? { id: row.track.id, name: row.track.name } : undefined,
    user: row.user ?? { id: row.userId, nickName: '', avatarUrl: '' },
    lapTimeDisplay: row.lapTimeDisplay,
    lapTimeMs: row.lapTimeMs,
    videoUrl: row.videoUrl,
    configSheet: mapConfigSheet(row),
    carPhotoUrls: row.carPhotos.map((p) => p.imageUrl),
    note: row.note ?? undefined,
    rank,
    isBestRecord,
    createdAt: row.createdAt.toISOString(),
  };
}

function toRecordBrief(
  row: RecordRow,
  isPersonalBest?: boolean,
): RecordBrief {
  return {
    id: row.id,
    trackId: row.trackId,
    trackName: row.track?.name,
    lapTimeDisplay: row.lapTimeDisplay,
    lapTimeMs: row.lapTimeMs,
    videoUrl: row.videoUrl,
    note: row.note ?? undefined,
    isPersonalBest,
    createdAt: row.createdAt.toISOString(),
  };
}

export class RecordService {
  async submit(userId: string, dto: SubmitRecordDto): Promise<RecordDetail> {
    const trackExists = await trackService.exists(dto.trackId);
    if (!trackExists) {
      throw trackNotFoundForRecordError();
    }

    let parsed;
    try {
      parsed = parseLapTime(dto.lapTimeDisplay);
    } catch {
      throw invalidLapTimeError();
    }

    const result = await prisma.$transaction(async () => {
      const record = await recordRepository.create(
        userId,
        dto,
        parsed.lapTimeMs,
        parsed.lapTimeDisplay,
      );
      const { isNewParticipant, updated } =
        await bestRecordRepository.upsertBest(
          dto.trackId,
          userId,
          record.id,
          parsed.lapTimeMs,
        );

      if (isNewParticipant) {
        await trackRepository.incrementRecordCount(dto.trackId);
      }

      return { record, updated };
    });

    if (result.updated) {
      await leaderboardService.invalidateCache(dto.trackId);
    }

    const { rank } = await leaderboardService.resolveRank(
      dto.trackId,
      result.record.id,
    );

    const best = await bestRecordRepository.findByTrackAndUser(
      dto.trackId,
      userId,
    );
    const isPersonalBest = best?.recordId === result.record.id;

    return {
      ...toRecordDetail(result.record, rank || undefined, isPersonalBest),
      isPersonalBest,
    };
  }

  async getById(recordId: string): Promise<RecordDetail> {
    const row = await recordRepository.findById(recordId);
    if (!row) {
      throw recordNotFoundError();
    }
    const { rank, isBestRecord } = await leaderboardService.resolveRank(
      row.trackId,
      recordId,
    );
    return toRecordDetail(row, rank || undefined, isBestRecord);
  }

  async getPersonalBest(
    userId: string,
    trackId: string,
  ): Promise<RecordBrief | null> {
    const best = await bestRecordRepository.findByTrackAndUser(trackId, userId);
    if (!best) return null;
    const row = await recordRepository.findById(best.recordId);
    if (!row) return null;
    return toRecordBrief(row, true);
  }

  async listByUser(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginationResult<RecordBrief>> {
    const skip = getSkip(query);
    const { rows, total } = await recordRepository.listByUser(
      userId,
      skip,
      query.pageSize,
    );

    const list = await Promise.all(
      rows.map(async (row) => {
        const best = await bestRecordRepository.findByTrackAndUser(
          row.trackId,
          userId,
        );
        const isPersonalBest = best?.recordId === row.id;
        return toRecordBrief(row, isPersonalBest);
      }),
    );

    return buildPaginationResult(list, total, query);
  }

  async listByTrack(
    trackId: string,
    operatorId: string,
    query: PaginationQuery,
  ): Promise<PaginationResult<RecordBrief>> {
    const track = await trackRepository.findById(trackId);
    if (!track) {
      throw trackNotFoundForRecordError();
    }
    if (track.creatorId !== operatorId) {
      throw forbiddenViewRecordsError();
    }

    const skip = getSkip(query);
    const { rows, total } = await recordRepository.listByTrack(
      trackId,
      skip,
      query.pageSize,
    );

    const list = await Promise.all(
      rows.map(async (row) => {
        const best = await bestRecordRepository.findByTrackAndUser(
          trackId,
          row.userId,
        );
        const isPersonalBest = best?.recordId === row.id;
        return toRecordBrief(row, isPersonalBest);
      }),
    );

    return buildPaginationResult(list, total, query);
  }
}

export const recordService = new RecordService();

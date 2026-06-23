import { withTransaction } from '../../lib/mysql';
import { parseLapTime } from '../../shared/lapTime';
import { buildPaginationResult, getSkip } from '../../shared/pagination';
import type { PaginationQuery, PaginationResult } from '../../shared/types';
import { trackRepository } from '../track/track.repository';
import { trackService } from '../track/track.service';
import { bestRecordRepository } from './bestRecord.repository';
import type {
  ApproveRecordDto,
  RecordBrief,
  RecordDetail,
  RecordStatus,
  RejectRecordDto,
  SubmitRecordDto,
} from './dto/record.types';
import {
  forbiddenReviewRecordError,
  forbiddenViewRecordsError,
  invalidLapTimeError,
  recordNotFoundError,
  recordNotPendingError,
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

function isTimeCorrected(row: RecordRow): boolean {
  return (
    row.status === 'approved' &&
    row.submittedLapTimeMs !== row.lapTimeMs
  );
}

function toRecordDetail(
  row: RecordRow,
  rank?: number,
  isBestRecord = false,
): RecordDetail {
  const user = row.user ?? { id: row.userId, nickName: '', avatarUrl: '' };
  return {
    id: row.id,
    trackId: row.trackId,
    trackName: row.track?.name,
    track: row.track ? { id: row.track.id, name: row.track.name } : undefined,
    user,
    status: row.status,
    lapTimeDisplay: row.lapTimeDisplay,
    submittedLapTimeDisplay: row.submittedLapTimeDisplay,
    videoUrl: row.videoUrl,
    configSheet: mapConfigSheet(row),
    carPhotoUrls: row.carPhotos.map((p) => p.imageUrl),
    note: row.note ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    timeCorrected: isTimeCorrected(row),
    reviewedAt: row.reviewedAt?.toISOString(),
    rank,
    isBestRecord,
    createdAt: row.createdAt.toISOString(),
  };
}

function toRecordBrief(
  row: RecordRow,
  isPersonalBest?: boolean,
  rank?: number,
): RecordBrief {
  return {
    id: row.id,
    trackId: row.trackId,
    trackName: row.track?.name,
    status: row.status,
    lapTimeDisplay: row.lapTimeDisplay,
    submittedLapTimeDisplay: row.submittedLapTimeDisplay,
    videoUrl: row.videoUrl,
    note: row.note ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    timeCorrected: isTimeCorrected(row),
    user: row.user,
    isPersonalBest,
    rank,
    createdAt: row.createdAt.toISOString(),
  };
}

async function assertTrackCreator(
  trackId: string,
  operatorId: string,
): Promise<void> {
  const track = await trackRepository.findById(trackId);
  if (!track) {
    throw trackNotFoundForRecordError();
  }
  if (track.creatorId !== operatorId) {
    throw forbiddenReviewRecordError();
  }
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

    const record = await recordRepository.create(
      userId,
      dto,
      parsed.lapTimeMs,
      parsed.lapTimeDisplay,
    );

    return {
      ...toRecordDetail(record),
      isPersonalBest: false,
    };
  }

  async approve(
    recordId: string,
    operatorId: string,
    dto: ApproveRecordDto,
  ): Promise<RecordDetail> {
    const row = await recordRepository.findById(recordId);
    if (!row) {
      throw recordNotFoundError();
    }
    if (row.status !== 'pending') {
      throw recordNotPendingError();
    }
    await assertTrackCreator(row.trackId, operatorId);

    const lapTimeDisplay = dto.lapTimeDisplay ?? row.submittedLapTimeDisplay;
    let parsed;
    try {
      parsed = parseLapTime(lapTimeDisplay);
    } catch {
      throw invalidLapTimeError();
    }

    const result = await withTransaction(async () => {
      await recordRepository.updateReview(recordId, {
        status: 'approved',
        lapTimeMs: parsed.lapTimeMs,
        lapTimeDisplay: parsed.lapTimeDisplay,
        reviewedBy: operatorId,
        reviewNote: dto.reviewNote ?? null,
      });

      const updated = await recordRepository.findById(recordId);
      if (!updated || updated.status !== 'approved') {
        throw recordNotPendingError();
      }

      const { isNewParticipant, updated: bestUpdated } =
        await bestRecordRepository.upsertBest(
          row.trackId,
          row.userId,
          recordId,
          parsed.lapTimeMs,
        );

      if (isNewParticipant) {
        await trackRepository.incrementRecordCount(row.trackId);
      }

      return { updated, bestUpdated, isNewParticipant };
    });

    if (result.bestUpdated) {
      await leaderboardService.invalidateCache(row.trackId);
    }

    const { rank, isBestRecord } = await leaderboardService.resolveRank(
      row.trackId,
      recordId,
    );

    return {
      ...toRecordDetail(result.updated, rank || undefined, isBestRecord),
      isPersonalBest: isBestRecord,
    };
  }

  async reject(
    recordId: string,
    operatorId: string,
    dto: RejectRecordDto,
  ): Promise<RecordDetail> {
    const row = await recordRepository.findById(recordId);
    if (!row) {
      throw recordNotFoundError();
    }
    if (row.status !== 'pending') {
      throw recordNotPendingError();
    }
    await assertTrackCreator(row.trackId, operatorId);

    await recordRepository.updateReview(recordId, {
      status: 'rejected',
      reviewedBy: operatorId,
      reviewNote: dto.reviewNote,
    });

    const updated = await recordRepository.findById(recordId);
    if (!updated) {
      throw recordNotFoundError();
    }

    return toRecordDetail(updated);
  }

  async getPendingCount(
    trackId: string,
    operatorId: string,
  ): Promise<{ count: number }> {
    await assertTrackCreator(trackId, operatorId);
    const count = await recordRepository.countByTrackAndStatus(
      trackId,
      'pending',
    );
    return { count };
  }

  async getById(recordId: string): Promise<RecordDetail> {
    const row = await recordRepository.findById(recordId);
    if (!row) {
      throw recordNotFoundError();
    }

    if (row.status !== 'approved') {
      return toRecordDetail(row);
    }

    const { rank, isBestRecord } = await leaderboardService.resolveRank(
      row.trackId,
      recordId,
    );
    return toRecordDetail(
      row,
      isBestRecord && rank ? rank : undefined,
      isBestRecord,
    );
  }

  async getPersonalBest(
    userId: string,
    trackId: string,
  ): Promise<RecordBrief | null> {
    const best = await bestRecordRepository.findByTrackAndUser(trackId, userId);
    if (!best) return null;
    const row = await recordRepository.findById(best.recordId);
    if (!row || row.status !== 'approved') return null;
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
        const isPersonalBest =
          row.status === 'approved' && best?.recordId === row.id;
        let rank: number | undefined;
        if (isPersonalBest) {
          const resolved = await leaderboardService.resolveRank(
            row.trackId,
            row.id,
          );
          rank = resolved.rank || undefined;
        }
        return toRecordBrief(row, isPersonalBest, rank);
      }),
    );

    return buildPaginationResult(list, total, query);
  }

  async listByTrack(
    trackId: string,
    operatorId: string,
    query: PaginationQuery & { status?: RecordStatus },
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
      query.status,
    );

    const list = await Promise.all(
      rows.map(async (row) => {
        const best = await bestRecordRepository.findByTrackAndUser(
          trackId,
          row.userId,
        );
        const isPersonalBest =
          row.status === 'approved' && best?.recordId === row.id;
        return toRecordBrief(row, isPersonalBest);
      }),
    );

    return buildPaginationResult(list, total, query);
  }
}

export const recordService = new RecordService();

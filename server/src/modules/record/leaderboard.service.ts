import { getRedis } from '../../lib/redis';
import { formatLapTime } from '../../shared/lapTime';
import type { PaginationQuery } from '../../shared/types';
import { trackRepository } from '../track/track.repository';
import { bestRecordRepository } from './bestRecord.repository';
import type { LeaderboardEntry, LeaderboardResult } from './dto/record.types';
import { recordRepository } from './record.repository';

const CACHE_TTL_SECONDS = 60;

function versionKey(trackId: string): string {
  return `lb:ver:${trackId}`;
}

function cacheKey(
  trackId: string,
  version: string,
  page: number,
  pageSize: number,
): string {
  return `lb:${trackId}:v${version}:p${page}:s${pageSize}`;
}

function computeRank(
  all: { lapTimeMs: number; firstAchievedAt: Date; recordId: string }[],
  targetRecordId: string,
): number {
  const idx = all.findIndex((r) => r.recordId === targetRecordId);
  return idx >= 0 ? idx + 1 : 0;
}

export class LeaderboardService {
  private async getCacheVersion(trackId: string): Promise<string> {
    const redis = getRedis();
    const version = await redis.get(versionKey(trackId));
    return version ?? '0';
  }

  async getRanking(
    trackId: string,
    query: PaginationQuery,
    viewerId?: string,
  ): Promise<LeaderboardResult> {
    const version = await this.getCacheVersion(trackId);
    const key = cacheKey(trackId, version, query.page, query.pageSize);
    const redis = getRedis();
    const cached = await redis.get(key);

    if (cached) {
      const result = JSON.parse(cached) as LeaderboardResult;
      if (viewerId) {
        result.myRank = await this.getMyRank(trackId, viewerId);
        result.pendingReviewCount =
          await recordRepository.countPendingByUserAndTrack(viewerId, trackId);
      }
      return result;
    }

    const track = await trackRepository.findById(trackId);
    const trackName = track?.name ?? '';

    const total = await bestRecordRepository.countByTrack(trackId);
    const skip = (query.page - 1) * query.pageSize;
    const rows = await bestRecordRepository.getRankingPage(
      trackId,
      skip,
      query.pageSize,
    );

    const list: LeaderboardEntry[] = rows.map((row, i) => ({
      rank: skip + i + 1,
      recordId: row.recordId,
      userId: row.userId,
      nickName: row.user?.nickName ?? '',
      avatarUrl: row.user?.avatarUrl ?? '',
      lapTimeDisplay: formatLapTime(row.lapTimeMs),
    }));

    const result: LeaderboardResult = {
      trackId,
      trackName,
      total,
      list,
    };

    if (viewerId) {
      result.myRank = await this.getMyRank(trackId, viewerId);
      result.pendingReviewCount =
        await recordRepository.countPendingByUserAndTrack(viewerId, trackId);
    }

    const toCache = { ...result, myRank: undefined, pendingReviewCount: undefined };
    await redis.set(key, JSON.stringify(toCache), CACHE_TTL_SECONDS);
    return result;
  }

  async getMyRank(
    trackId: string,
    userId: string,
  ): Promise<LeaderboardResult['myRank']> {
    const best = await bestRecordRepository.findByTrackAndUser(trackId, userId);
    if (!best) return undefined;

    const all = await bestRecordRepository.getAllByTrack(trackId);
    const rank = computeRank(all, best.recordId);
    if (rank === 0) return undefined;

    return {
      rank,
      recordId: best.recordId,
      lapTimeDisplay: formatLapTime(best.lapTimeMs),
    };
  }

  async resolveRank(
    trackId: string,
    recordId: string,
  ): Promise<{ rank: number; isBestRecord: boolean }> {
    const all = await bestRecordRepository.getAllByTrack(trackId);
    const target = all.find((r) => r.recordId === recordId);

    if (!target) {
      const record = await recordRepository.findById(recordId);
      if (!record) {
        return { rank: 0, isBestRecord: false };
      }
      const best = await bestRecordRepository.findByTrackAndUser(
        trackId,
        record.userId,
      );
      if (!best) {
        return { rank: 0, isBestRecord: false };
      }
      const rank = computeRank(all, best.recordId);
      return { rank, isBestRecord: false };
    }

    const rank = computeRank(all, recordId);
    return { rank, isBestRecord: true };
  }

  async invalidateCache(trackId: string): Promise<void> {
    const redis = getRedis();
    const current = await redis.get(versionKey(trackId));
    const next = String((Number(current) || 0) + 1);
    await redis.set(versionKey(trackId), next);
  }
}

export const leaderboardService = new LeaderboardService();

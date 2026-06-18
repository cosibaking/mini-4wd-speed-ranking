import { haversineMeters } from '../../shared/haversine';
import { buildPaginationResult, getSkip } from '../../shared/pagination';
import type { PaginationQuery, PaginationResult } from '../../shared/types';
import { leaderboardService } from '../record/leaderboard.service';
import type {
  CreateTrackDto,
  LeaderboardSummary,
  TrackDetail,
  TrackListItem,
  TrackListQuery,
  UpdateTrackDto,
} from './dto/track.types';
import {
  duplicateTrackNameError,
  forbiddenEditTrackError,
  trackNotFoundError,
} from './errors';
import { recentVisitService } from './recentVisit.service';
import { trackRepository, type TrackRow } from './track.repository';

function toTrackDetail(row: TrackRow, summary?: LeaderboardSummary): TrackDetail {
  return {
    id: row.id,
    name: row.name,
    location: {
      lat: row.lat,
      lng: row.lng,
      address: row.address,
    },
    organizerName: row.organizerName,
    organizerContact: row.organizerContact ?? undefined,
    lengthMeters: row.lengthMeters ?? undefined,
    floorPlanUrls: row.floorPlans.map((fp) => fp.imageUrl),
    exampleVideoUrl: row.exampleVideoUrl ?? undefined,
    ruleNote: row.ruleNote ?? undefined,
    creatorId: row.creatorId,
    recordCount: row.recordCount,
    leaderboardSummary: summary,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toListItem(
  row: TrackRow,
  summary: LeaderboardSummary,
  userLat?: number,
  userLng?: number,
): TrackListItem {
  const distanceMeters =
    userLat !== undefined && userLng !== undefined
      ? haversineMeters(userLat, userLng, row.lat, row.lng)
      : null;

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    distanceMeters,
    participantCount: summary.participantCount,
    recordCount: row.recordCount,
    topRecord: summary.topRecord
      ? {
          nickName: summary.topRecord.nickName,
          lapTimeDisplay: summary.topRecord.lapTimeDisplay,
        }
      : undefined,
  };
}

export class TrackService {
  async create(creatorId: string, dto: CreateTrackDto): Promise<TrackDetail> {
    const duplicate = await trackRepository.isNameDuplicate(creatorId, dto.name);
    if (duplicate) {
      throw duplicateTrackNameError();
    }
    const row = await trackRepository.create(creatorId, dto);
    const summary = await this.getLeaderboardSummary(row.id);
    return toTrackDetail(row, summary);
  }

  async update(
    trackId: string,
    operatorId: string,
    dto: UpdateTrackDto,
  ): Promise<TrackDetail> {
    const existing = await trackRepository.findById(trackId);
    if (!existing) {
      throw trackNotFoundError();
    }
    if (existing.creatorId !== operatorId) {
      throw forbiddenEditTrackError();
    }
    if (dto.name) {
      const duplicate = await trackRepository.isNameDuplicate(
        operatorId,
        dto.name,
        trackId,
      );
      if (duplicate) {
        throw duplicateTrackNameError();
      }
    }
    const row = await trackRepository.update(trackId, dto);
    const summary = await this.getLeaderboardSummary(trackId);
    return toTrackDetail(row, summary);
  }

  async getById(trackId: string, viewerId?: string): Promise<TrackDetail> {
    const row = await trackRepository.findById(trackId);
    if (!row) {
      throw trackNotFoundError();
    }
    if (viewerId) {
      recentVisitService.touchRecentVisit(viewerId, trackId).catch(() => {
        // 异步记录最近访问，不阻塞响应
      });
    }
    const summary = await this.getLeaderboardSummary(trackId);
    return toTrackDetail(row, summary);
  }

  async exists(trackId: string): Promise<boolean> {
    return trackRepository.exists(trackId);
  }

  async list(query: TrackListQuery): Promise<PaginationResult<TrackListItem>> {
    const rows = await trackRepository.listAll(query.keyword);
    const summaries = await Promise.all(
      rows.map((r) => this.getLeaderboardSummary(r.id)),
    );

    let items = rows.map((row, i) =>
      toListItem(row, summaries[i]!, query.lat, query.lng),
    );

    if (query.sort === 'distance' && query.lat !== undefined && query.lng !== undefined) {
      items.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
    }

    const total = items.length;
    const skip = getSkip(query);
    const list = items.slice(skip, skip + query.pageSize);
    return buildPaginationResult(list, total, query);
  }

  async listByCreator(
    creatorId: string,
    query: PaginationQuery,
  ): Promise<PaginationResult<TrackListItem>> {
    const skip = getSkip(query);
    const { rows, total } = await trackRepository.listByCreator(
      creatorId,
      skip,
      query.pageSize,
    );
    const summaries = await Promise.all(
      rows.map((r) => this.getLeaderboardSummary(r.id)),
    );
    const list = rows.map((row, i) => toListItem(row, summaries[i]!));
    return buildPaginationResult(list, total, query);
  }

  async isNameDuplicate(
    creatorId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    return trackRepository.isNameDuplicate(creatorId, name, excludeId);
  }

  async touchRecentVisit(userId: string, trackId: string): Promise<void> {
    const exists = await trackRepository.exists(trackId);
    if (!exists) {
      throw trackNotFoundError();
    }
    await recentVisitService.touchRecentVisit(userId, trackId);
  }

  async getRecentVisits(userId: string, limit = 3): Promise<TrackListItem[]> {
    const visits = await recentVisitService.getRecentVisits(userId, limit);
    const items: TrackListItem[] = [];
    for (const visit of visits) {
      const row = await trackRepository.findById(visit.trackId);
      if (!row) continue;
      const summary = await this.getLeaderboardSummary(row.id);
      items.push(toListItem(row, summary));
    }
    return items;
  }

  async getLeaderboardSummary(trackId: string): Promise<LeaderboardSummary> {
    const rank = await leaderboardService.getRanking(trackId, {
      page: 1,
      pageSize: 1,
    });
    const participantCount = await trackRepository.getRecordCount(trackId);
    const top = rank.list[0];
    return {
      topRecord: top
        ? {
            userId: top.userId,
            nickName: top.nickName,
            lapTimeDisplay: top.lapTimeDisplay,
          }
        : undefined,
      participantCount,
    };
  }
}

export const trackService = new TrackService();

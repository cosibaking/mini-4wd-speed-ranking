import { request } from './http';
import { USE_MOCK_FALLBACK } from '../config';
import type {
  PaginationQuery,
  PaginationResult,
  TrackDetail,
  TrackListItem,
} from '../types';

const MOCK_TRACKS: TrackListItem[] = [
  {
    id: 'track-1',
    name: '朝阳公园北广场赛道',
    location: { lat: 39.9321, lng: 116.4547, address: '北京市朝阳区朝阳公园北路' },
    organizerName: '阿速',
    distance: 1200,
    topRecord: { nickName: '闪电小子', lapTimeDisplay: '0:32.580' },
    participantCount: 18,
  },
  {
    id: 'track-2',
    name: '奥森南园迷你赛道',
    location: { lat: 40.0089, lng: 116.3974, address: '北京市朝阳区奥林匹克森林公园' },
    organizerName: '四驱老王',
    distance: 3500,
    topRecord: { nickName: '涡轮达人', lapTimeDisplay: '0:28.120' },
    participantCount: 42,
  },
];

function mockPaginate<T>(list: T[], query: PaginationQuery = {}): PaginationResult<T> {
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const start = (page - 1) * pageSize;
  const slice = list.slice(start, start + pageSize);
  return {
    list: slice,
    total: list.length,
    page,
    pageSize,
    hasMore: start + pageSize < list.length,
  };
}

type ApiTrackListItem = TrackListItem & {
  distanceMeters?: number | null;
};

/** 统一服务端列表字段，兼容 address / distanceMeters */
function normalizeTrackListItem(raw: ApiTrackListItem): TrackListItem {
  const address = raw.address ?? raw.location?.address ?? '';
  const distance =
    raw.distance ?? (raw.distanceMeters != null ? raw.distanceMeters : undefined);

  return {
    id: raw.id,
    name: raw.name,
    address,
    location: raw.location ?? { lat: 0, lng: 0, address },
    organizerName: raw.organizerName ?? '',
    distance,
    topRecord: raw.topRecord,
    participantCount: raw.participantCount ?? 0,
  };
}

function normalizeTrackList(items: ApiTrackListItem[]): TrackListItem[] {
  return items.map(normalizeTrackListItem);
}

export async function listTracks(
  query: PaginationQuery & {
    lat?: number;
    lng?: number;
    keyword?: string;
    sort?: 'distance' | 'latest';
  } = {}
): Promise<PaginationResult<TrackListItem>> {
  const params: Record<string, unknown> = {};
  if (query.page) params.page = query.page;
  if (query.pageSize) params.pageSize = query.pageSize;
  if (query.keyword) params.keyword = query.keyword;
  if (query.lat !== undefined) params.lat = query.lat;
  if (query.lng !== undefined) params.lng = query.lng;
  if (query.sort) params.sort = query.sort;

  try {
    const res = await request<PaginationResult<ApiTrackListItem>>('/tracks', {
      data: params,
      auth: false,
    });
    return { ...res, list: normalizeTrackList(res.list) };
  } catch (e) {
    if (!USE_MOCK_FALLBACK) throw e;
    let list = [...MOCK_TRACKS];
    if (query.keyword) {
      list = list.filter((t) => t.name.includes(query.keyword!));
    }
    return mockPaginate(list, query);
  }
}

export async function getTrack(id: string): Promise<TrackDetail> {
  try {
    return await request<TrackDetail>(`/tracks/${id}`, { auth: false });
  } catch (e) {
    if (!USE_MOCK_FALLBACK) throw e;
    const item = MOCK_TRACKS.find((t) => t.id === id) || MOCK_TRACKS[0];
    return {
      id: item.id,
      name: item.name,
      location: item.location,
      organizerName: item.organizerName,
      organizerContact: 'wxid_demo',
      lengthMeters: 120,
      floorPlanUrls: [],
      exampleVideoUrl: '',
      ruleNote: '从起跑线到终点线，视频需连续无剪辑。',
      creatorId: 'user-demo',
      recordCount: item.participantCount,
      leaderboardSummary: {
        topRecord: item.topRecord
          ? { userId: 'u1', nickName: item.topRecord.nickName, lapTimeDisplay: item.topRecord.lapTimeDisplay }
          : undefined,
        participantCount: item.participantCount,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export function getRecentTracks(): Promise<TrackListItem[]> {
  return request<ApiTrackListItem[]>('/tracks/recent').then(normalizeTrackList);
}

export function getMyTracks(query: PaginationQuery = {}): Promise<PaginationResult<TrackListItem>> {
  return request('/tracks/mine', { data: query as Record<string, unknown> });
}

export function createTrack(data: Record<string, unknown>): Promise<TrackDetail> {
  return request<TrackDetail>('/tracks', { method: 'POST', data });
}

export function updateTrack(id: string, data: Record<string, unknown>): Promise<TrackDetail> {
  return request<TrackDetail>(`/tracks/${id}`, { method: 'PATCH', data });
}

export function touchRecentVisit(trackId: string): Promise<void> {
  return request<void>(`/tracks/${trackId}/visit`, { method: 'POST' }).catch(() => undefined as void);
}

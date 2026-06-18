import { request } from './http';
import { USE_MOCK_FALLBACK } from '../config';
import type {
  LeaderboardResult,
  PaginationQuery,
  PaginationResult,
  RecordBrief,
  RecordDetail,
} from '../types';

const MOCK_LEADERBOARD: LeaderboardResult = {
  trackId: 'track-1',
  trackName: '朝阳公园北广场赛道',
  total: 5,
  list: [
    { rank: 1, recordId: 'r1', user: { id: 'u1', nickName: '闪电小子', avatarUrl: '' }, lapTimeDisplay: '0:32.580' },
    { rank: 2, recordId: 'r2', user: { id: 'u2', nickName: '涡轮达人', avatarUrl: '' }, lapTimeDisplay: '0:33.010' },
    { rank: 3, recordId: 'r3', user: { id: 'u3', nickName: '弯道王', avatarUrl: '' }, lapTimeDisplay: '0:33.120' },
    { rank: 4, recordId: 'r4', user: { id: 'u4', nickName: '新手阿明', avatarUrl: '' }, lapTimeDisplay: '0:35.200' },
    { rank: 5, recordId: 'r5', user: { id: 'u5', nickName: '公园车手', avatarUrl: '' }, lapTimeDisplay: '0:36.800' },
  ],
  myRank: { rank: 8, lapTimeDisplay: '0:35.200', recordId: 'r4' },
};

export async function getLeaderboard(
  trackId: string,
  query: PaginationQuery = {}
): Promise<LeaderboardResult> {
  try {
    return await request<LeaderboardResult>(`/leaderboards/${trackId}`, {
      data: query as Record<string, unknown>,
      auth: false,
    });
  } catch (e) {
    if (!USE_MOCK_FALLBACK) throw e;
    return { ...MOCK_LEADERBOARD, trackId };
  }
}

export async function getRecord(id: string): Promise<RecordDetail> {
  try {
    return await request<RecordDetail>(`/records/${id}`, { auth: false });
  } catch (e) {
    if (!USE_MOCK_FALLBACK) throw e;
    const entry = MOCK_LEADERBOARD.list.find((r) => r.recordId === id) || MOCK_LEADERBOARD.list[0];
    return {
      id: entry.recordId,
      trackId: MOCK_LEADERBOARD.trackId,
      trackName: MOCK_LEADERBOARD.trackName,
      user: entry.user,
      lapTimeDisplay: entry.lapTimeDisplay,
      rank: entry.rank,
      videoUrl: '',
      carPhotoUrls: [],
      note: '示例成绩记录',
      createdAt: new Date().toISOString(),
    };
  }
}

export function submitRecord(data: Record<string, unknown>): Promise<RecordDetail> {
  return request<RecordDetail>('/records', { method: 'POST', data });
}

export function getMyRecords(query: PaginationQuery = {}): Promise<PaginationResult<RecordBrief>> {
  return request('/records/mine', { data: query as Record<string, unknown> });
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
}

export interface UserProfile {
  id: string;
  nickName: string;
  avatarUrl: string;
  isOrganizer: boolean;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  nickName: string;
  avatarUrl: string;
}

export interface LeaderboardSummary {
  topRecord?: { userId: string; nickName: string; lapTimeDisplay: string };
  participantCount: number;
}

export interface TrackListItem {
  id: string;
  name: string;
  /** 列表摘要地址（与 location.address 二选一，服务端列表接口直接返回） */
  address?: string;
  location?: GeoPoint;
  organizerName?: string;
  distance?: number;
  topRecord?: { nickName: string; lapTimeDisplay: string };
  participantCount: number;
}

export interface TrackDetail {
  id: string;
  name: string;
  location: GeoPoint;
  organizerName: string;
  organizerContact?: string;
  lengthMeters?: number;
  floorPlanUrls: string[];
  exampleVideoUrl?: string;
  ruleNote?: string;
  creatorId: string;
  recordCount: number;
  leaderboardSummary?: LeaderboardSummary;
  createdAt: string;
  updatedAt: string;
}

export interface RecordBrief {
  id: string;
  trackId: string;
  trackName?: string;
  lapTimeDisplay: string;
  rank?: number;
  createdAt: string;
}

export interface RecordDetail {
  id: string;
  trackId: string;
  trackName: string;
  user: PublicUser;
  lapTimeDisplay: string;
  rank: number;
  videoUrl: string;
  configSheet?: { type: 'text'; content: string } | { type: 'image'; url: string };
  carPhotoUrls: string[];
  note?: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  recordId: string;
  user: PublicUser;
  lapTimeDisplay: string;
}

export interface LeaderboardResult {
  trackId: string;
  trackName: string;
  total: number;
  list: LeaderboardEntry[];
  myRank?: { rank: number; lapTimeDisplay: string; recordId: string };
}

export interface Board {
  id: string;
  name: string;
  description?: string;
}

export interface PostListItem {
  id: string;
  boardId: string;
  title: string;
  summary: string;
  author: PublicUser;
  likeCount: number;
  commentCount: number;
  liked?: boolean;
  createdAt: string;
}

export interface PostDetail extends PostListItem {
  content: string;
  images: string[];
  trackId?: string;
  trackName?: string;
  followingAuthor?: boolean;
}

export interface CommentItem {
  id: string;
  author: PublicUser;
  content: string;
  likeCount: number;
  liked?: boolean;
  createdAt: string;
}

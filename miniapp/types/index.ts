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

export type OrganizerApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface OrganizerApplicationBrief {
  id: string;
  status: OrganizerApplicationStatus;
  realName: string;
  phone: string;
  wechat?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface UserProfile {
  id: string;
  nickName: string;
  avatarUrl: string;
  bio: string;
  isOrganizer: boolean;
  isAdmin: boolean;
  adminRole?: 'admin' | 'operator';
  organizerApplication?: OrganizerApplicationBrief;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  nickName: string;
  avatarUrl: string;
  bio?: string;
}

export interface PublicUserDetail extends PublicUser {
  following?: boolean;
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

export type RecordStatus = 'pending' | 'approved' | 'rejected';

export interface RecordBrief {
  id: string;
  trackId: string;
  trackName?: string;
  status: RecordStatus;
  lapTimeDisplay: string;
  submittedLapTimeDisplay: string;
  reviewNote?: string;
  timeCorrected?: boolean;
  rank?: number;
  isPersonalBest?: boolean;
  user?: PublicUser;
  createdAt: string;
}

export interface RecordDetail {
  id: string;
  trackId: string;
  trackName: string;
  user: PublicUser;
  status: RecordStatus;
  lapTimeDisplay: string;
  submittedLapTimeDisplay: string;
  reviewNote?: string;
  timeCorrected?: boolean;
  rank?: number;
  isBestRecord?: boolean;
  reviewedAt?: string;
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
  pendingReviewCount?: number;
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
  coverImage?: string | null;
}

export interface PostDetail extends PostListItem {
  content: string;
  images: string[];
  trackId?: string;
  trackName?: string;
  followingAuthor?: boolean;
}

export interface CommentReplyTo {
  id: string;
  nickName: string;
}

export interface CommentItem {
  id: string;
  author: PublicUser;
  content: string;
  images: string[];
  /** 原始网络 URL，用于预览及相册返回后重新下载展示 */
  imageUrls?: string[];
  likeCount: number;
  liked?: boolean;
  createdAt: string;
  parentId?: string;
  replyTo?: CommentReplyTo;
  replies?: CommentItem[];
}

export type NotificationType =
  | 'record_approved'
  | 'record_rejected'
  | 'record_pending_review'
  | 'organizer_approved'
  | 'organizer_rejected'
  | 'post_liked'
  | 'comment_liked'
  | 'post_commented'
  | 'comment_replied'
  | 'system';

export interface NotificationPayload {
  recordId?: string;
  trackId?: string;
  trackName?: string;
  postId?: string;
  commentId?: string;
  applicationId?: string;
  actorId?: string;
  actorNickName?: string;
  linkPath?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  payload?: NotificationPayload;
  isRead: boolean;
  createdAt: string;
}

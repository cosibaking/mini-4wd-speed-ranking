export type RecordStatus = 'pending' | 'approved' | 'rejected';

export interface SubmitRecordDto {
  trackId: string;
  lapTimeDisplay: string;
  videoUrl: string;
  configSheet?:
    | { type: 'text'; content: string }
    | { type: 'image'; url: string };
  carPhotoUrls?: string[];
  note?: string;
}

export interface ApproveRecordDto {
  lapTimeDisplay?: string;
  reviewNote?: string;
}

export interface RejectRecordDto {
  reviewNote: string;
}

export interface RecordBrief {
  id: string;
  trackId: string;
  trackName?: string;
  status: RecordStatus;
  lapTimeDisplay: string;
  submittedLapTimeDisplay: string;
  videoUrl?: string;
  note?: string;
  reviewNote?: string;
  timeCorrected?: boolean;
  isPersonalBest?: boolean;
  user?: { id: string; nickName: string; avatarUrl: string };
  rank?: number;
  createdAt: string;
}

export interface RecordDetail extends RecordBrief {
  user: { id: string; nickName: string; avatarUrl: string };
  configSheet?:
    | { type: 'text'; content: string }
    | { type: 'image'; url: string };
  carPhotoUrls: string[];
  rank?: number;
  isBestRecord?: boolean;
  isPersonalBest?: boolean;
  reviewedAt?: string;
  track?: { id: string; name: string };
}

export interface LeaderboardEntry {
  rank: number;
  recordId: string;
  userId: string;
  nickName: string;
  avatarUrl: string;
  lapTimeDisplay: string;
}

export interface LeaderboardResult {
  trackId: string;
  trackName: string;
  total: number;
  list: LeaderboardEntry[];
  myRank?: {
    rank: number;
    lapTimeDisplay: string;
    recordId: string;
  };
  pendingReviewCount?: number;
}

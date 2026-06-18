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

export interface RecordBrief {
  id: string;
  trackId: string;
  trackName?: string;
  lapTimeDisplay: string;
  lapTimeMs: number;
  videoUrl?: string;
  note?: string;
  isPersonalBest?: boolean;
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
}

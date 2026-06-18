import type { GeoPoint } from '../../../shared/types';

export interface CreateTrackDto {
  name: string;
  location: GeoPoint;
  organizerName: string;
  organizerContact?: string;
  lengthMeters?: number;
  floorPlanUrls?: string[];
  exampleVideoUrl?: string;
  ruleNote?: string;
}

export interface UpdateTrackDto {
  name?: string;
  location?: GeoPoint;
  organizerName?: string;
  organizerContact?: string;
  lengthMeters?: number;
  floorPlanUrls?: string[];
  exampleVideoUrl?: string;
  ruleNote?: string;
}

export interface TrackListQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  lat?: number;
  lng?: number;
  sort?: 'distance' | 'latest';
}

export interface LeaderboardSummary {
  topRecord?: {
    userId: string;
    nickName: string;
    lapTimeDisplay: string;
  };
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

export interface TrackListItem {
  id: string;
  name: string;
  address: string;
  distanceMeters: number | null;
  participantCount: number;
  recordCount?: number;
  topRecord?: {
    nickName: string;
    lapTimeDisplay: string;
  };
}

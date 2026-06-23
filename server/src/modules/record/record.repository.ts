import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne } from '../../lib/mysql';
import type { RecordStatus, SubmitRecordDto } from './dto/record.types';

interface RecordDbRow extends RowDataPacket {
  id: string;
  track_id: string;
  user_id: string;
  lap_time_ms: number;
  lap_time_display: string;
  video_url: string;
  config_sheet_type: 'text' | 'image' | null;
  config_sheet_text: string | null;
  config_sheet_url: string | null;
  note: string | null;
  status: RecordStatus;
  submitted_lap_time_ms: number;
  submitted_lap_time_display: string;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_note: string | null;
  created_at: Date;
}

interface CarPhotoRow extends RowDataPacket {
  image_url: string;
  sort_order: number;
}

interface UserBriefRow extends RowDataPacket {
  id: string;
  nick_name: string;
  avatar_url: string;
}

interface TrackBriefRow extends RowDataPacket {
  id: string;
  name: string;
}

export interface RecordRow {
  id: string;
  trackId: string;
  userId: string;
  lapTimeMs: number;
  lapTimeDisplay: string;
  videoUrl: string;
  configSheetType: 'text' | 'image' | null;
  configSheetText: string | null;
  configSheetUrl: string | null;
  note: string | null;
  status: RecordStatus;
  submittedLapTimeMs: number;
  submittedLapTimeDisplay: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
  carPhotos: { imageUrl: string; sortOrder: number }[];
  user?: { id: string; nickName: string; avatarUrl: string };
  track?: { id: string; name: string };
}

async function loadCarPhotos(recordId: string): Promise<CarPhotoRow[]> {
  return query<CarPhotoRow>(
    'SELECT image_url, sort_order FROM record_car_photos WHERE record_id = ? ORDER BY sort_order ASC',
    [recordId],
  );
}

function mapRecord(
  row: RecordDbRow,
  carPhotos: CarPhotoRow[],
  user?: UserBriefRow,
  track?: TrackBriefRow,
): RecordRow {
  return {
    id: row.id,
    trackId: row.track_id,
    userId: row.user_id,
    lapTimeMs: row.lap_time_ms,
    lapTimeDisplay: row.lap_time_display,
    videoUrl: row.video_url,
    configSheetType: row.config_sheet_type,
    configSheetText: row.config_sheet_text,
    configSheetUrl: row.config_sheet_url,
    note: row.note,
    status: row.status,
    submittedLapTimeMs: row.submitted_lap_time_ms,
    submittedLapTimeDisplay: row.submitted_lap_time_display,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    createdAt: row.created_at,
    carPhotos: carPhotos.map((photo) => ({
      imageUrl: photo.image_url,
      sortOrder: photo.sort_order,
    })),
    user: user
      ? { id: user.id, nickName: user.nick_name, avatarUrl: user.avatar_url }
      : undefined,
    track: track ? { id: track.id, name: track.name } : undefined,
  };
}

export class RecordRepository {
  async create(
    userId: string,
    dto: SubmitRecordDto,
    lapTimeMs: number,
    lapTimeDisplay: string,
  ): Promise<RecordRow> {
    const id = randomUUID();
    const configSheetType = dto.configSheet?.type ?? null;
    const configSheetText =
      dto.configSheet?.type === 'text' ? dto.configSheet.content : null;
    const configSheetUrl =
      dto.configSheet?.type === 'image' ? dto.configSheet.url : null;

    await execute(
      `INSERT INTO records (
        id, track_id, user_id, lap_time_ms, lap_time_display, video_url,
        config_sheet_type, config_sheet_text, config_sheet_url, note,
        status, submitted_lap_time_ms, submitted_lap_time_display, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW(3))`,
      [
        id,
        dto.trackId,
        userId,
        lapTimeMs,
        lapTimeDisplay,
        dto.videoUrl,
        configSheetType,
        configSheetText,
        configSheetUrl,
        dto.note ?? null,
        lapTimeMs,
        lapTimeDisplay,
      ],
    );

    if (dto.carPhotoUrls?.length) {
      for (let i = 0; i < dto.carPhotoUrls.length; i += 1) {
        await execute(
          'INSERT INTO record_car_photos (record_id, image_url, sort_order) VALUES (?, ?, ?)',
          [id, dto.carPhotoUrls[i], i],
        );
      }
    }

    const record = await this.findById(id);
    if (!record) {
      throw new Error('failed to create record');
    }
    return record;
  }

  async updateReview(
    recordId: string,
    data: {
      status: 'approved';
      lapTimeMs: number;
      lapTimeDisplay: string;
      reviewedBy: string;
      reviewNote?: string | null;
    } | {
      status: 'rejected';
      reviewedBy: string;
      reviewNote?: string | null;
    },
  ): Promise<void> {
    if (data.status === 'approved') {
      await execute(
        `UPDATE records SET
          status = 'approved',
          lap_time_ms = ?,
          lap_time_display = ?,
          reviewed_by = ?,
          reviewed_at = NOW(3),
          review_note = ?
         WHERE id = ? AND status = 'pending'`,
        [
          data.lapTimeMs,
          data.lapTimeDisplay,
          data.reviewedBy,
          data.reviewNote ?? null,
          recordId,
        ],
      );
      return;
    }

    await execute(
      `UPDATE records SET
        status = 'rejected',
        reviewed_by = ?,
        reviewed_at = NOW(3),
        review_note = ?
       WHERE id = ? AND status = 'pending'`,
      [data.reviewedBy, data.reviewNote ?? null, recordId],
    );
  }

  async countByTrackAndStatus(
    trackId: string,
    status: RecordStatus,
  ): Promise<number> {
    const row = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM records WHERE track_id = ? AND status = ?',
      [trackId, status],
    );
    return Number(row?.count ?? 0);
  }

  async countPendingByUserAndTrack(
    userId: string,
    trackId: string,
  ): Promise<number> {
    const row = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM records WHERE user_id = ? AND track_id = ? AND status = ?',
      [userId, trackId, 'pending'],
    );
    return Number(row?.count ?? 0);
  }

  async findById(recordId: string): Promise<RecordRow | null> {
    const row = await queryOne<RecordDbRow>(
      'SELECT * FROM records WHERE id = ? LIMIT 1',
      [recordId],
    );
    if (!row) {
      return null;
    }

    const [carPhotos, user, track] = await Promise.all([
      loadCarPhotos(recordId),
      queryOne<UserBriefRow>(
        'SELECT id, nick_name, avatar_url FROM users WHERE id = ? LIMIT 1',
        [row.user_id],
      ),
      queryOne<TrackBriefRow>(
        'SELECT id, name FROM tracks WHERE id = ? LIMIT 1',
        [row.track_id],
      ),
    ]);

    return mapRecord(row, carPhotos, user ?? undefined, track ?? undefined);
  }

  async listByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{ rows: RecordRow[]; total: number }> {
    const [rows, countRow] = await Promise.all([
      query<RecordDbRow>(
        'SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, take, skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        'SELECT COUNT(*) AS count FROM records WHERE user_id = ?',
        [userId],
      ),
    ]);

    const mapped = await Promise.all(
      rows.map(async (row) => {
        const [carPhotos, track] = await Promise.all([
          loadCarPhotos(row.id),
          queryOne<TrackBriefRow>(
            'SELECT id, name FROM tracks WHERE id = ? LIMIT 1',
            [row.track_id],
          ),
        ]);
        return mapRecord(row, carPhotos, undefined, track ?? undefined);
      }),
    );

    return { rows: mapped, total: Number(countRow?.count ?? 0) };
  }

  async listByTrack(
    trackId: string,
    skip: number,
    take: number,
    status?: RecordStatus,
  ): Promise<{ rows: RecordRow[]; total: number }> {
    const whereClause = status
      ? 'WHERE track_id = ? AND status = ?'
      : 'WHERE track_id = ?';
    const params = status ? [trackId, status] : [trackId];

    const [rows, countRow] = await Promise.all([
      query<RecordDbRow>(
        `SELECT * FROM records ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, take, skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        `SELECT COUNT(*) AS count FROM records ${whereClause}`,
        params,
      ),
    ]);

    const mapped = await Promise.all(
      rows.map(async (row) => {
        const [carPhotos, user] = await Promise.all([
          loadCarPhotos(row.id),
          queryOne<UserBriefRow>(
            'SELECT id, nick_name, avatar_url FROM users WHERE id = ? LIMIT 1',
            [row.user_id],
          ),
        ]);
        return mapRecord(row, carPhotos, user ?? undefined, undefined);
      }),
    );

    return { rows: mapped, total: Number(countRow?.count ?? 0) };
  }
}

export const recordRepository = new RecordRepository();

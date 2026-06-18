import type { RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne } from '../../lib/mysql';

interface BestRecordDbRow extends RowDataPacket {
  track_id: string;
  user_id: string;
  record_id: string;
  lap_time_ms: number;
  first_achieved_at: Date;
}

interface UserBriefRow extends RowDataPacket {
  id: string;
  nick_name: string;
  avatar_url: string;
}

export interface BestRecordRow {
  trackId: string;
  userId: string;
  recordId: string;
  lapTimeMs: number;
  firstAchievedAt: Date;
  user?: { id: string; nickName: string; avatarUrl: string };
}

async function mapWithUser(row: BestRecordDbRow): Promise<BestRecordRow> {
  const user = await queryOne<UserBriefRow>(
    'SELECT id, nick_name, avatar_url FROM users WHERE id = ? LIMIT 1',
    [row.user_id],
  );

  return {
    trackId: row.track_id,
    userId: row.user_id,
    recordId: row.record_id,
    lapTimeMs: row.lap_time_ms,
    firstAchievedAt: row.first_achieved_at,
    user: user
      ? { id: user.id, nickName: user.nick_name, avatarUrl: user.avatar_url }
      : undefined,
  };
}

export class BestRecordRepository {
  async findByTrackAndUser(
    trackId: string,
    userId: string,
  ): Promise<BestRecordRow | null> {
    const row = await queryOne<BestRecordDbRow>(
      'SELECT * FROM track_best_records WHERE track_id = ? AND user_id = ? LIMIT 1',
      [trackId, userId],
    );
    if (!row) {
      return null;
    }
    return mapWithUser(row);
  }

  async upsertBest(
    trackId: string,
    userId: string,
    recordId: string,
    lapTimeMs: number,
  ): Promise<{ isNewParticipant: boolean; updated: boolean }> {
    const existing = await queryOne<BestRecordDbRow>(
      'SELECT * FROM track_best_records WHERE track_id = ? AND user_id = ? LIMIT 1',
      [trackId, userId],
    );

    if (!existing) {
      await execute(
        `INSERT INTO track_best_records (
          track_id, user_id, record_id, lap_time_ms, first_achieved_at, updated_at
        ) VALUES (?, ?, ?, ?, NOW(3), NOW(3))`,
        [trackId, userId, recordId, lapTimeMs],
      );
      return { isNewParticipant: true, updated: true };
    }

    if (lapTimeMs < existing.lap_time_ms) {
      await execute(
        `UPDATE track_best_records
         SET record_id = ?, lap_time_ms = ?, first_achieved_at = NOW(3), updated_at = NOW(3)
         WHERE track_id = ? AND user_id = ?`,
        [recordId, lapTimeMs, trackId, userId],
      );
      return { isNewParticipant: false, updated: true };
    }

    return { isNewParticipant: false, updated: false };
  }

  async countByTrack(trackId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM track_best_records WHERE track_id = ?',
      [trackId],
    );
    return Number(row?.count ?? 0);
  }

  async getRankingPage(
    trackId: string,
    skip: number,
    take: number,
  ): Promise<BestRecordRow[]> {
    const rows = await query<BestRecordDbRow>(
      `SELECT * FROM track_best_records
       WHERE track_id = ?
       ORDER BY lap_time_ms ASC, first_achieved_at ASC
       LIMIT ? OFFSET ?`,
      [trackId, take, skip],
    );
    return Promise.all(rows.map(mapWithUser));
  }

  async getAllByTrack(trackId: string): Promise<BestRecordRow[]> {
    const rows = await query<BestRecordDbRow>(
      `SELECT * FROM track_best_records
       WHERE track_id = ?
       ORDER BY lap_time_ms ASC, first_achieved_at ASC`,
      [trackId],
    );
    return Promise.all(rows.map(mapWithUser));
  }
}

export const bestRecordRepository = new BestRecordRepository();

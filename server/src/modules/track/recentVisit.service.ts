import type { RowDataPacket } from 'mysql2/promise';

import { execute, query } from '../../lib/mysql';

interface RecentVisitRow extends RowDataPacket {
  track_id: string;
  visited_at: Date;
}

export class RecentVisitService {
  async touchRecentVisit(userId: string, trackId: string): Promise<void> {
    await execute(
      `INSERT INTO recent_track_visits (user_id, track_id, visited_at)
       VALUES (?, ?, NOW(3))
       ON DUPLICATE KEY UPDATE visited_at = NOW(3)`,
      [userId, trackId],
    );
  }

  async getRecentVisits(
    userId: string,
    limit = 3,
  ): Promise<{ trackId: string; visitedAt: Date }[]> {
    const rows = await query<RecentVisitRow>(
      'SELECT track_id, visited_at FROM recent_track_visits WHERE user_id = ? ORDER BY visited_at DESC LIMIT ?',
      [userId, limit],
    );

    return rows.map((row) => ({
      trackId: row.track_id,
      visitedAt: row.visited_at,
    }));
  }
}

export const recentVisitService = new RecentVisitService();

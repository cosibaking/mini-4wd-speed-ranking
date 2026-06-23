import { loadEnvFile } from '../lib/env.js';
import { connectMysql, disconnectMysql, execute } from '../lib/mysql.js';

loadEnvFile();

const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  openId: 'seed-demo-organizer',
  nickName: '阿速',
} as const;

const DEMO_TRACKS = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    name: '朝阳公园北广场赛道',
    lat: 39.9321,
    lng: 116.4547,
    address: '北京市朝阳区朝阳公园北路',
    organizerName: '阿速',
    lengthMeters: 120,
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    name: '奥森南园迷你赛道',
    lat: 40.0089,
    lng: 116.3974,
    address: '北京市朝阳区奥林匹克森林公园',
    organizerName: '四驱老王',
    lengthMeters: 120,
  },
] as const;

const BOARDS = [
  {
    id: 'track_event',
    name: '赛道/赛事专区',
    description: '赛道活动、赛事通知、圈速讨论',
    sortOrder: 1,
  },
  {
    id: 'newbie',
    name: '新手入门区',
    description: '入门教程、规则科普',
    sortOrder: 2,
  },
  {
    id: 'driver_chat',
    name: '车手交流区',
    description: '改装、手感、闲聊',
    sortOrder: 3,
  },
  {
    id: 'new_product',
    name: '新品发布区',
    description: '装备新品、开箱',
    sortOrder: 4,
  },
] as const;

async function main(): Promise<void> {
  await connectMysql();

  for (const board of BOARDS) {
    await execute(
      `INSERT INTO boards (id, name, description, sort_order, created_at)
       VALUES (?, ?, ?, ?, NOW(3))
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         sort_order = VALUES(sort_order)`,
      [board.id, board.name, board.description, board.sortOrder],
    );
  }

  await execute(
    `INSERT INTO users (
      id, open_id, nick_name, avatar_url, is_organizer_certified, created_at, updated_at
    ) VALUES (?, ?, ?, '', 1, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE
       nick_name = VALUES(nick_name),
       is_organizer_certified = 1`,
    [DEMO_USER.id, DEMO_USER.openId, DEMO_USER.nickName],
  );

  for (const track of DEMO_TRACKS) {
    await execute(
      `INSERT INTO tracks (
         id, creator_id, name, lat, lng, address,
         organizer_name, length_meters, record_count, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE
         address = VALUES(address),
         organizer_name = VALUES(organizer_name),
         length_meters = VALUES(length_meters)`,
      [
        track.id,
        DEMO_USER.id,
        track.name,
        track.lat,
        track.lng,
        track.address,
        track.organizerName,
        track.lengthMeters,
      ],
    );
  }

  console.log(`Seeded ${BOARDS.length} boards, ${DEMO_TRACKS.length} demo tracks`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMysql();
  });

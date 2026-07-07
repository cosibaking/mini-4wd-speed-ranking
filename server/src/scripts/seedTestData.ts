/**
 * 测试数据生成脚本（可重复运行）。
 *
 * 生成：10 主理人 + 200 车手 + 60 帖子 + 若干评论/关注，
 * 并给「当前登录账号」造关注/被关注数据。
 * 不生成赛道、圈速、榜单等赛道相关数据。
 *
 * 只清理带 seedx- 前缀的种子数据，不会动真实账号、真实申请等。
 *
 * 目标账号：默认自动识别最近登录的真实用户（open_id 不以 seedx- 开头），
 * 也可通过环境变量 SEED_TARGET_USER_ID 指定。
 *
 * 运行：node dist/scripts/seedTestData.js
 */
import { randomUUID } from 'node:crypto';

import type { RowDataPacket } from 'mysql2/promise';

import { loadEnvFile } from '../lib/env.js';
import { connectMysql, disconnectMysql, execute, query } from '../lib/mysql.js';

loadEnvFile();

const NUM_ORGANIZERS = 10;
const NUM_DRIVERS = 200;
const NUM_POSTS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPastDate(maxDaysAgo: number): Date {
  return new Date(NOW - randInt(0, maxDaysAgo) * DAY_MS - randInt(0, DAY_MS));
}

const ADJS = [
  '疾风', '闪电', '涡轮', '氮气', '暴走', '弯道', '直线', '夜行',
  '追风', '烈焰', '寒冰', '雷霆', '风驰', '极速', '狂野', '流光',
] as const;
const NOUNS = [
  '车神', '老王', '小四', '阿速', '车魂', '飞侠', '骑士', '大师',
  '玩家', '达人', '狂人', '少年', '前辈', '新手', '队长', '车匠',
] as const;

function makeNick(seed: number): string {
  return `${pick(ADJS)}${pick(NOUNS)}${seed}`;
}

/**
 * 生成头像 URL。使用固定的小头像池（而非每人唯一 seed），
 * 让不同用户复用同一批 URL：既有视觉多样性，又能被客户端缓存，
 * 避免大量唯一请求触发公共头像服务（DiceBear）的 429 限流。
 */
const AVATAR_SEEDS = [
  'Felix', 'Aneka', 'Milo', 'Zoe', 'Max', 'Luna',
  'Leo', 'Nova', 'Kai', 'Mia', 'Rex', 'Ivy',
] as const;

function avatarFor(index: number): string {
  const seed = AVATAR_SEEDS[index % AVATAR_SEEDS.length];
  const bg = 'ffd5dc,ffdfbf,d1d4f9,c0aede,b6e3f4,ffe0b2';
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}&backgroundColor=${bg}`;
}

const BOARDS = [
  { id: 'track_event', name: '赛道/赛事专区', description: '赛道活动、赛事通知、圈速讨论', sortOrder: 1 },
  { id: 'newbie', name: '新手入门区', description: '入门教程、规则科普', sortOrder: 2 },
  { id: 'driver_chat', name: '车手交流区', description: '改装、手感、闲聊', sortOrder: 3 },
  { id: 'new_product', name: '新品发布区', description: '装备新品、开箱', sortOrder: 4 },
] as const;

const POST_TITLES = [
  '周末交流赛报名，来刷圈啊', '这款马达怎么配齿轮比？', '新手第一次上赛道紧张到不行',
  '分享一套稳定的四轮定位方案', '电池选镍氢还是锂电？求建议', '弯道总是翻车，导轮该怎么调',
  '开箱：入手了新款高速马达', '赛道视频拍摄小技巧分享', '今天破了自己的最好成绩！',
  '关于起步加速的一点心得', '车壳减重到底值不值得', '组队约练，坐标市中心公园',
  '电刷保养多久做一次比较好', '不同赛道对齿比的影响很大', '给新人的十条避坑建议',
] as const;

const POST_CONTENTS = [
  '本周六上午9点，欢迎车友带车来刷圈，赛道已开放练习，记得带好电池和备用马达。',
  '刚入手高速马达，求大佬指点齿轮比和导轮搭配，目前用的是 3.5:1，感觉出弯不太稳。',
  '第一次正式跑赛道，手一直在抖，成绩很一般，但真的很上头，下周还来！',
  '经过反复调试，终于找到一套比较稳的定位方案，分享给大家，欢迎讨论。',
  '最近纠结电池选型，镍氢便宜耐造，锂电轻但贵，大家都怎么选？',
  '每次过发卡弯都翻，导轮高度和角度到底怎么调才合理，求指点。',
  '新款马达到手，转速比老款高不少，简单开箱测评一下。',
  '拍成绩视频总是糊，分享几个我常用的固定机位和光线技巧。',
  '今天状态特别好，一举刷进了赛道前十，激动到手抖，继续努力！',
  '起步那零点几秒真的很关键，说说我练习起步的一些小方法。',
] as const;

const COMMENTS = [
  '学到了，感谢分享！', '同求这个配置', '大佬带带我', '这个赛道我也常去',
  '成绩不错啊，膜拜', '下次一起约练', '马克一下，回去试试', '有视频吗想看看',
  '新手表示很有帮助', '齿比这块确实讲究',
] as const;

interface IdRow extends RowDataPacket {
  id: string;
}

const SEED_PREFIX = 'seedx-';

async function cleanupSeedData(): Promise<void> {
  const usersSub = `SELECT id FROM users WHERE open_id LIKE '${SEED_PREFIX}%'`;
  const tracksSub = `SELECT id FROM tracks WHERE creator_id IN (${usersSub})`;
  const mockPostsSub = 'SELECT id FROM posts WHERE mock_data = 1';
  const mockCommentsSub = `SELECT id FROM comments WHERE post_id IN (${mockPostsSub})`;

  await execute(`DELETE FROM track_best_records WHERE track_id IN (${tracksSub})`);
  await execute(
    `DELETE FROM record_car_photos WHERE record_id IN (SELECT id FROM records WHERE track_id IN (${tracksSub}))`,
  );
  await execute(`DELETE FROM records WHERE track_id IN (${tracksSub})`);
  await execute(
    `DELETE FROM likes WHERE (target_type = 'post' AND target_id IN (${mockPostsSub})) OR (target_type = 'comment' AND target_id IN (${mockCommentsSub}))`,
  );
  await execute(`DELETE FROM likes WHERE user_id IN (${usersSub})`);
  await execute(
    `DELETE FROM comment_images WHERE comment_id IN (${mockCommentsSub})`,
  );
  await execute(`DELETE FROM comments WHERE post_id IN (${mockPostsSub})`);
  await execute(`DELETE FROM post_images WHERE post_id IN (${mockPostsSub})`);
  await execute('DELETE FROM posts WHERE mock_data = 1');
  await execute(`DELETE FROM follows WHERE follower_id IN (${usersSub}) OR followee_id IN (${usersSub})`);
  await execute(`DELETE FROM recent_track_visits WHERE track_id IN (${tracksSub}) OR user_id IN (${usersSub})`);
  await execute(`DELETE FROM organizer_applications WHERE user_id IN (${usersSub})`);
  await execute(`DELETE FROM tracks WHERE creator_id IN (${usersSub})`);
  await execute(`DELETE FROM users WHERE open_id LIKE '${SEED_PREFIX}%'`);
}

async function resolveTargetUserId(): Promise<string> {
  const override = process.env.SEED_TARGET_USER_ID;
  if (override) {
    const row = await query<IdRow>('SELECT id FROM users WHERE id = ? LIMIT 1', [override]);
    if (row.length === 0) {
      throw new Error(`指定的 SEED_TARGET_USER_ID 不存在：${override}`);
    }
    return override;
  }
  const rows = await query<IdRow>(
    `SELECT id FROM users WHERE open_id NOT LIKE '${SEED_PREFIX}%' ORDER BY created_at DESC LIMIT 1`,
  );
  if (rows.length === 0) {
    throw new Error('未找到真实登录用户，请通过 SEED_TARGET_USER_ID 指定目标账号');
  }
  return rows[0].id;
}

async function bulkInsert(
  table: string,
  columns: string[],
  rows: unknown[][],
  chunkSize = 200,
): Promise<void> {
  if (rows.length === 0) return;
  const colSql = columns.map((c) => `\`${c}\``).join(', ');
  const placeholder = `(${columns.map(() => '?').join(', ')})`;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valuesSql = chunk.map(() => placeholder).join(', ');
    const params = chunk.flat() as (string | number | Date | null)[];
    await execute(`INSERT INTO ${table} (${colSql}) VALUES ${valuesSql}`, params);
  }
}

async function main(): Promise<void> {
  await connectMysql();

  const targetUserId = await resolveTargetUserId();
  console.log(`[seed] 目标账号（我的数据）：${targetUserId}`);

  await cleanupSeedData();
  console.log('[seed] 已清理旧的 seed 数据');

  // 1) boards
  for (const b of BOARDS) {
    await execute(
      `INSERT INTO boards (id, name, description, sort_order, created_at)
       VALUES (?, ?, ?, ?, NOW(3))
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sort_order = VALUES(sort_order)`,
      [b.id, b.name, b.description, b.sortOrder],
    );
  }

  // 2) users: organizers + drivers
  const organizerIds: string[] = [];
  const driverIds: string[] = [];
  const userRows: unknown[][] = [];

  for (let i = 0; i < NUM_ORGANIZERS; i += 1) {
    const id = randomUUID();
    organizerIds.push(id);
    const createdAt = randomPastDate(120);
    const openId = `${SEED_PREFIX}org-${String(i + 1).padStart(2, '0')}`;
    userRows.push([
      id,
      openId,
      `主理人·${makeNick(i + 1)}`,
      avatarFor(i),
      1,
      createdAt,
      createdAt,
    ]);
  }
  for (let i = 0; i < NUM_DRIVERS; i += 1) {
    const id = randomUUID();
    driverIds.push(id);
    const createdAt = randomPastDate(120);
    const openId = `${SEED_PREFIX}drv-${String(i + 1).padStart(3, '0')}`;
    userRows.push([
      id,
      openId,
      makeNick(i + 1),
      avatarFor(i),
      0,
      createdAt,
      createdAt,
    ]);
  }
  await bulkInsert(
    'users',
    ['id', 'open_id', 'nick_name', 'avatar_url', 'is_organizer_certified', 'created_at', 'updated_at'],
    userRows,
  );
  console.log(`[seed] 用户：${NUM_ORGANIZERS} 主理人 + ${NUM_DRIVERS} 车手`);

  // 3) posts + comments
  const allUserIds = [...organizerIds, ...driverIds];
  const postRows: unknown[][] = [];
  const commentRows: unknown[][] = [];
  for (let i = 0; i < NUM_POSTS; i += 1) {
    const postId = randomUUID();
    const board = pick(BOARDS);
    const authorId = pick(allUserIds);
    const likeCount = randInt(0, 200);
    const commentCount = randInt(0, 8);
    const hotScore = likeCount * 3 + commentCount * 5 + randInt(0, 50);
    const createdAt = randomPastDate(90);
    postRows.push([
      postId,
      board.id,
      authorId,
      null,
      pick(POST_TITLES),
      pick(POST_CONTENTS),
      likeCount,
      commentCount,
      hotScore,
      1,
      createdAt,
      createdAt,
    ]);
    for (let c = 0; c < commentCount; c += 1) {
      commentRows.push([
        randomUUID(),
        postId,
        pick(allUserIds),
        pick(COMMENTS),
        randInt(0, 20),
        new Date(createdAt.getTime() + randInt(1, 72) * 60 * 60 * 1000),
      ]);
    }
  }
  await bulkInsert(
    'posts',
    ['id', 'board_id', 'author_id', 'track_id', 'title', 'content', 'like_count', 'comment_count', 'hot_score', 'mock_data', 'created_at', 'updated_at'],
    postRows,
  );
  await bulkInsert(
    'comments',
    ['id', 'post_id', 'author_id', 'content', 'like_count', 'created_at'],
    commentRows,
  );
  console.log(`[seed] 帖子：${postRows.length}，评论：${commentRows.length}`);

  // 4) follows：随机社交关系 + 目标账号关注/被关注
  const followSet = new Set<string>();
  const followRows: unknown[][] = [];
  function addFollow(follower: string, followee: string): void {
    if (follower === followee) return;
    const key = `${follower}:${followee}`;
    if (followSet.has(key)) return;
    followSet.add(key);
    followRows.push([follower, followee, randomPastDate(80)]);
  }
  for (let i = 0; i < 400; i += 1) {
    addFollow(pick(allUserIds), pick(allUserIds));
  }
  // 目标账号关注 15 人，被 25 人关注
  for (let i = 0; i < 15; i += 1) addFollow(targetUserId, pick(allUserIds));
  for (let i = 0; i < 25; i += 1) addFollow(pick(allUserIds), targetUserId);
  await bulkInsert('follows', ['follower_id', 'followee_id', 'created_at'], followRows);
  console.log(`[seed] 关注关系：${followRows.length}`);

  console.log('[seed] 完成 ✅');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectMysql();
  });

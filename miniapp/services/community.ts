import { request } from './http';
import { USE_MOCK_FALLBACK } from '../config';
import { normalizeUrlList } from '../utils/mediaUrl';
import type {
  Board,
  CommentItem,
  PaginationQuery,
  PaginationResult,
  PostDetail,
  PostListItem,
  PublicUser,
} from '../types';

const MOCK_BOARDS: Board[] = [
  { id: 'b1', name: '赛道/赛事专区', description: '赛道活动、赛事通知' },
  { id: 'b2', name: '新手入门区', description: '入门教程、规则科普' },
  { id: 'b3', name: '车手交流区', description: '改装、手感、闲聊' },
  { id: 'b4', name: '新品发布区', description: '装备新品、开箱' },
];

const MOCK_POSTS: PostListItem[] = [
  {
    id: 'p1',
    boardId: 'b1',
    title: '周末朝阳公园交流赛报名',
    summary: '本周六上午9点，欢迎车友带车来刷圈…',
    author: { id: 'u1', nickName: '阿速', avatarUrl: '' },
    likeCount: 12,
    commentCount: 5,
    createdAt: '2026-06-17T10:00:00Z',
  },
  {
    id: 'p2',
    boardId: 'b3',
    title: '这款马达怎么配齿轮比？',
    summary: '刚入手高速马达，求大佬指点…',
    author: { id: 'u2', nickName: '涡轮达人', avatarUrl: '' },
    likeCount: 8,
    commentCount: 15,
    createdAt: '2026-06-16T14:30:00Z',
  },
];

function normalizePostDetail(raw: Record<string, unknown>): PostDetail {
  const imageUrls = normalizeUrlList(raw.imageUrls ?? raw.images);
  const followingAuthor =
    (raw.followingAuthor as boolean | undefined) ??
    (raw.authorFollowed as boolean | undefined) ??
    false;

  return {
    ...(raw as unknown as PostDetail),
    images: imageUrls,
    followingAuthor,
  };
}

function flattenComments(list: CommentItem[]): CommentItem[] {
  const flat: CommentItem[] = [];
  for (const item of list) {
    const { replies, ...rest } = item;
    flat.push(rest);
    if (replies?.length) {
      flat.push(...flattenComments(replies));
    }
  }
  return flat;
}

function normalizeComment(raw: Record<string, unknown>): CommentItem {
  const imageUrls = normalizeUrlList(raw.imageUrls ?? raw.images);
  const repliesRaw = (raw.replies as Record<string, unknown>[] | undefined) ?? [];
  const author = (raw.author as CommentItem['author']) ?? { id: '', nickName: '用户', avatarUrl: '' };
  return {
    id: String(raw.id ?? ''),
    author,
    content: String(raw.content ?? ''),
    images: imageUrls,
    imageUrls,
    likeCount: Number(raw.likeCount ?? 0),
    liked: raw.liked as boolean | undefined,
    createdAt: String(raw.createdAt ?? ''),
    parentId: raw.parentId ? String(raw.parentId) : undefined,
    replyTo: raw.replyTo as CommentItem['replyTo'],
    replies: repliesRaw.map(normalizeComment),
  };
}

export async function listBoards(): Promise<Board[]> {
  try {
    const res = await request<{ list: Board[] } | Board[]>('/boards', { auth: false });
    return Array.isArray(res) ? res : (res.list ?? []);
  } catch (e) {
    if (!USE_MOCK_FALLBACK) throw e;
    return MOCK_BOARDS;
  }
}

export async function listPosts(
  query: PaginationQuery & { boardId?: string; sort?: 'latest' | 'hot' } = {}
): Promise<PaginationResult<PostListItem>> {
  if (!query.boardId) {
    return {
      list: [],
      total: 0,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
      hasMore: false,
    };
  }
  try {
    return await request('/posts', { data: query as Record<string, unknown>, auth: false });
  } catch (e) {
    if (!USE_MOCK_FALLBACK) throw e;
    let list = [...MOCK_POSTS];
    if (query.boardId) list = list.filter((p) => p.boardId === query.boardId);
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    return {
      list,
      total: list.length,
      page,
      pageSize,
      hasMore: false,
    };
  }
}

export async function getPost(id: string): Promise<PostDetail> {
  try {
    const raw = await request<Record<string, unknown>>(`/posts/${id}`, { auth: false });
    return normalizePostDetail(raw);
  } catch (e) {
    if (!USE_MOCK_FALLBACK) throw e;
    const item = MOCK_POSTS.find((p) => p.id === id) || MOCK_POSTS[0];
    return {
      ...item,
      content: item.summary + '\n\n欢迎车友交流讨论，分享你的改装心得。',
      images: [],
      liked: false,
      followingAuthor: false,
    };
  }
}

export function createPost(data: {
  boardId: string;
  title: string;
  content: string;
  images?: string[];
  imageUrls?: string[];
}): Promise<PostDetail> {
  const { images, imageUrls, ...rest } = data;
  return request<Record<string, unknown>>('/posts', {
    method: 'POST',
    data: { ...rest, imageUrls: imageUrls ?? images ?? [] },
  }).then(normalizePostDetail);
}

export async function listComments(
  postId: string,
  query: PaginationQuery = { page: 1, pageSize: 100 }
): Promise<PaginationResult<CommentItem>> {
  try {
    const res = await request<PaginationResult<Record<string, unknown>>>(`/posts/${postId}/comments`, {
      data: { page: query.page ?? 1, pageSize: query.pageSize ?? 100 } as Record<string, unknown>,
      auth: false,
    });
    const normalized = (res.list ?? []).map(normalizeComment);
    return {
      ...res,
      list: flattenComments(normalized),
    };
  } catch (e) {
    if (!USE_MOCK_FALLBACK) throw e;
    return {
      list: [
        {
          id: 'c1',
          author: { id: 'u3', nickName: '弯道王', avatarUrl: '' },
          content: '说得对，周末见！',
          images: [],
          likeCount: 2,
          createdAt: '2026-06-17T11:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      hasMore: false,
    };
  }
}

export function createComment(
  postId: string,
  data: { content: string; images?: string[]; parentId?: string }
): Promise<CommentItem> {
  return request<Record<string, unknown>>(`/posts/${postId}/comments`, {
    method: 'POST',
    data: {
      content: data.content,
      imageUrls: data.images ?? [],
      ...(data.parentId ? { parentId: data.parentId } : {}),
    },
  }).then(normalizeComment);
}

export function toggleLike(target: { type: 'post' | 'comment'; id: string }): Promise<{ liked: boolean; likeCount: number }> {
  return request('/social/like', {
    method: 'POST',
    data: { targetType: target.type, targetId: target.id },
  });
}

export function toggleFollow(followeeId: string): Promise<{ following: boolean }> {
  return request('/social/follow', { method: 'POST', data: { followeeId } });
}

export function listFollowing(query: PaginationQuery = {}): Promise<PaginationResult<PublicUser>> {
  return request('/social/following', { data: query as Record<string, unknown> });
}

export function listFollowingPosts(query: PaginationQuery = {}): Promise<PaginationResult<PostListItem>> {
  return request('/posts/following', { data: query as Record<string, unknown> });
}

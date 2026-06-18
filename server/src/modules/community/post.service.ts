import { ValidationError } from '../../shared/errors.js';
import { buildPaginationResult, getSkip } from '../../shared/pagination.js';
import type { PaginationQuery, PaginationResult } from '../../shared/types.js';
import { userService } from '../auth/user.service.js';
import { trackService } from '../track/track.service.js';
import type { CreatePostDto, PostDetail, PostListItem, PostListQuery } from './dto/create-post.dto.js';
import {
  boardNotFoundError,
  postContentLengthError,
  postNotFoundError,
  postRateLimitError,
} from './errors.js';
import { followRepository } from './follow.repository.js';
import { postRepository, type PostWithRelations } from './post.repository.js';
import { checkRateLimit } from './rateLimit.util.js';

function summarize(content: string, maxLength = 80): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}...`;
}

function toPostListItem(
  post: PostWithRelations,
  author: { id: string; nickName: string; avatarUrl: string },
  liked?: boolean,
): PostListItem {
  return {
    id: post.id,
    title: post.title,
    summary: summarize(post.content),
    boardId: post.boardId,
    author,
    track: post.track ? { id: post.track.id, name: post.track.name } : undefined,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt.toISOString(),
    coverImage: post.images[0]?.imageUrl ?? null,
    ...(liked !== undefined ? { liked } : {}),
  };
}

async function toPostDetail(
  post: PostWithRelations,
  author: { id: string; nickName: string; avatarUrl: string },
  viewerId?: string,
): Promise<PostDetail> {
  let liked = false;
  let authorFollowed = false;

  if (viewerId) {
    const likedIds = await postRepository.findLikedPostIds(viewerId, [post.id]);
    liked = likedIds.has(post.id);
    authorFollowed = await followRepository.isFollowing(viewerId, post.authorId);
  }

  return {
    id: post.id,
    boardId: post.boardId,
    boardName: post.board.name,
    title: post.title,
    content: post.content,
    imageUrls: post.images.map((image) => image.imageUrl),
    track: post.track ? { id: post.track.id, name: post.track.name } : undefined,
    author,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    liked,
    authorFollowed,
    createdAt: post.createdAt.toISOString(),
  };
}

export class PostService {
  async create(authorId: string, dto: CreatePostDto): Promise<PostDetail> {
    const allowed = await checkRateLimit(`rl:post:${authorId}`, 10);
    if (!allowed) {
      throw postRateLimitError();
    }

    const board = await postRepository.findBoardById(dto.boardId);
    if (!board) {
      throw boardNotFoundError();
    }

    const title = dto.title.trim();
    const content = dto.content.trim();
    if (title.length < 1 || title.length > 50 || content.length < 1 || content.length > 5000) {
      throw postContentLengthError();
    }

    const imageUrls = dto.imageUrls ?? [];
    if (imageUrls.length > 9) {
      throw new ValidationError('\u56fe\u7247\u6700\u591a 9 \u5f20');
    }

    if (dto.trackId) {
      const trackExists = await trackService.exists(dto.trackId);
      if (!trackExists) {
        throw new ValidationError('\u5173\u8054\u8d5b\u9053\u4e0d\u5b58\u5728');
      }
    }

    const post = await postRepository.create({
      boardId: dto.boardId,
      authorId,
      title,
      content,
      trackId: dto.trackId,
      imageUrls,
    });

    const profiles = await userService.getPublicProfiles([authorId]);
    const author = profiles.get(authorId) ?? {
      id: authorId,
      nickName: '',
      avatarUrl: '',
    };

    return toPostDetail(post, author, authorId);
  }

  async getById(postId: string, viewerId?: string): Promise<PostDetail> {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw postNotFoundError();
    }

    const profiles = await userService.getPublicProfiles([post.authorId]);
    const author = profiles.get(post.authorId) ?? {
      id: post.authorId,
      nickName: '',
      avatarUrl: '',
    };

    return toPostDetail(post, author, viewerId);
  }

  async list(
    query: PostListQuery,
    viewerId?: string,
  ): Promise<PaginationResult<PostListItem>> {
    if (!query.boardId) {
      throw new ValidationError('boardId \u5fc5\u586b');
    }

    const board = await postRepository.findBoardById(query.boardId);
    if (!board) {
      throw boardNotFoundError();
    }

    const pagination: PaginationQuery = {
      page: query.page,
      pageSize: query.pageSize,
    };

    const { rows, total } = await postRepository.list({
      boardId: query.boardId,
      sort: query.sort ?? 'latest',
      trackId: query.trackId,
      skip: getSkip(pagination),
      take: pagination.pageSize,
    });

    const authorIds = [...new Set(rows.map((post) => post.authorId))];
    const profiles = await userService.getPublicProfiles(authorIds);
    const likedIds =
      viewerId !== undefined
        ? await postRepository.findLikedPostIds(
            viewerId,
            rows.map((post) => post.id),
          )
        : new Set<string>();

    const list = rows.map((post) => {
      const author = profiles.get(post.authorId) ?? {
        id: post.authorId,
        nickName: '',
        avatarUrl: '',
      };
      return toPostListItem(post, author, viewerId !== undefined ? likedIds.has(post.id) : undefined);
    });

    return buildPaginationResult(list, total, pagination);
  }

  async listFollowingFeed(
    viewerId: string,
    query: PaginationQuery,
  ): Promise<PaginationResult<PostListItem>> {
    const { rows, total } = await postRepository.listFollowingFeed({
      followerId: viewerId,
      skip: getSkip(query),
      take: query.pageSize,
    });

    const authorIds = [...new Set(rows.map((post) => post.authorId))];
    const profiles = await userService.getPublicProfiles(authorIds);
    const likedIds = await postRepository.findLikedPostIds(
      viewerId,
      rows.map((post) => post.id),
    );

    const list = rows.map((post) => {
      const author = profiles.get(post.authorId) ?? {
        id: post.authorId,
        nickName: '',
        avatarUrl: '',
      };
      return toPostListItem(post, author, likedIds.has(post.id));
    });

    return buildPaginationResult(list, total, query);
  }
}

export const postService = new PostService();

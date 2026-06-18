import { ValidationError } from '../../shared/errors.js';
import { buildPaginationResult, getSkip } from '../../shared/pagination.js';
import type { PaginationQuery, PaginationResult } from '../../shared/types.js';
import { userService } from '../auth/user.service.js';
import type { CommentItem, CreateCommentDto } from './dto/create-comment.dto.js';
import {
  cannotFollowSelfError,
  commentNotFoundError,
  commentRateLimitError,
  postContentLengthError,
  postNotFoundError,
} from './errors.js';
import { commentRepository } from './comment.repository.js';
import { followRepository } from './follow.repository.js';
import { likeRepository } from './like.repository.js';
import { postRepository } from './post.repository.js';
import { checkRateLimit } from './rateLimit.util.js';

export type LikeTarget = { type: 'post'; id: string } | { type: 'comment'; id: string };

export class SocialService {
  async toggleLike(
    userId: string,
    target: LikeTarget,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const targetType = target.type;
    const existing = await likeRepository.findLike(userId, targetType, target.id);

    if (target.type === 'post') {
      const post = await postRepository.findById(target.id);
      if (!post) {
        throw postNotFoundError();
      }
    } else {
      const comment = await commentRepository.findById(target.id);
      if (!comment) {
        throw commentNotFoundError();
      }
    }

    if (existing) {
      await likeRepository.delete(userId, targetType, target.id);
      const likeCount =
        target.type === 'post'
          ? await postRepository.updateLikeCount(target.id, -1)
          : await commentRepository.updateLikeCount(target.id, -1);
      return { liked: false, likeCount };
    }

    await likeRepository.create(userId, targetType, target.id);
    const likeCount =
      target.type === 'post'
        ? await postRepository.updateLikeCount(target.id, 1)
        : await commentRepository.updateLikeCount(target.id, 1);
    return { liked: true, likeCount };
  }

  async createComment(userId: string, dto: CreateCommentDto): Promise<CommentItem> {
    const allowed = await checkRateLimit(`rl:comment:${userId}`, 30);
    if (!allowed) {
      throw commentRateLimitError();
    }

    const post = await postRepository.findById(dto.postId);
    if (!post) {
      throw postNotFoundError();
    }

    const content = dto.content.trim();
    if (content.length < 1 || content.length > 500) {
      throw postContentLengthError();
    }

    const comment = await commentRepository.create(dto.postId, userId, content);
    await postRepository.incrementCommentCount(dto.postId);

    return {
      id: comment.id,
      content: comment.content,
      author: comment.author,
      likeCount: comment.likeCount,
      liked: false,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async listComments(
    postId: string,
    query: PaginationQuery,
    viewerId?: string,
  ): Promise<PaginationResult<CommentItem>> {
    const post = await postRepository.findById(postId);
    if (!post) {
      throw postNotFoundError();
    }

    const { rows, total } = await commentRepository.listByPost(
      postId,
      getSkip(query),
      query.pageSize,
    );

    const likedIds =
      viewerId !== undefined
        ? await commentRepository.findLikedCommentIds(
            viewerId,
            rows.map((comment) => comment.id),
          )
        : new Set<string>();

    const list: CommentItem[] = rows.map((comment) => ({
      id: comment.id,
      content: comment.content,
      author: comment.author,
      likeCount: comment.likeCount,
      liked: viewerId !== undefined ? likedIds.has(comment.id) : false,
      createdAt: comment.createdAt.toISOString(),
    }));

    return buildPaginationResult(list, total, query);
  }

  async toggleFollow(
    followerId: string,
    followeeId: string,
  ): Promise<{ following: boolean }> {
    if (followerId === followeeId) {
      throw cannotFollowSelfError();
    }

    const followee = await userService.getPublicProfiles([followeeId]);
    if (!followee.has(followeeId)) {
      throw new ValidationError('\u7528\u6237\u4e0d\u5b58\u5728');
    }

    const existing = await followRepository.findFollow(followerId, followeeId);
    if (existing) {
      await followRepository.delete(followerId, followeeId);
      return { following: false };
    }

    await followRepository.create(followerId, followeeId);
    return { following: true };
  }

  async listFollowing(
    userId: string,
    query: PaginationQuery,
  ): Promise<PaginationResult<{ id: string; nickName: string; avatarUrl: string; followedAt: string }>> {
    const { rows, total } = await followRepository.listFollowing(
      userId,
      getSkip(query),
      query.pageSize,
    );

    const list = rows.map((row) => ({
      id: row.followee.id,
      nickName: row.followee.nickName,
      avatarUrl: row.followee.avatarUrl,
      followedAt: row.createdAt.toISOString(),
    }));

    return buildPaginationResult(list, total, query);
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    return followRepository.isFollowing(followerId, followeeId);
  }
}

export const socialService = new SocialService();

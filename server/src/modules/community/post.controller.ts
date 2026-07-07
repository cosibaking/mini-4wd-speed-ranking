import type { HttpContext } from '../../lib/http/index.js';

import { parsePagination } from '../../shared/pagination.js';
import { success } from '../../shared/response.js';
import type { CreatePostDto, PostListQuery } from './dto/create-post.dto.js';
import { postService } from './post.service.js';
import { socialService } from './social.service.js';

export async function createPost(ctx: HttpContext): Promise<void> {
  const authorId = ctx.state.auth!.userId;
  const body = ctx.request.body as CreatePostDto;

  const data = await postService.create(authorId, {
    boardId: body.boardId,
    title: body.title,
    content: body.content,
    imageUrls: body.imageUrls,
    trackId: body.trackId,
  });

  ctx.body = success(data);
}

export async function listPosts(ctx: HttpContext): Promise<void> {
  const query = ctx.query as Record<string, string | undefined>;
  const pagination = parsePagination(query);

  const listQuery: PostListQuery = {
    boardId: query.boardId,
    authorId: query.authorId,
    sort: query.sort === 'hot' ? 'hot' : 'latest',
    trackId: query.trackId,
    page: pagination.page,
    pageSize: pagination.pageSize,
  };

  const data = await postService.list(listQuery, ctx.state.auth?.userId);
  ctx.body = success(data);
}

export async function listFollowingPosts(ctx: HttpContext): Promise<void> {
  const viewerId = ctx.state.auth!.userId;
  const pagination = parsePagination(ctx.query as Record<string, string | undefined>);
  const data = await postService.listFollowingFeed(viewerId, pagination);
  ctx.body = success(data);
}

export async function getPost(ctx: HttpContext): Promise<void> {
  const postId = ctx.params.id;
  const data = await postService.getById(postId, ctx.state.auth?.userId);
  ctx.body = success(data);
}

export async function listComments(ctx: HttpContext): Promise<void> {
  const postId = ctx.params.id;
  const pagination = parsePagination(ctx.query as Record<string, string | undefined>);
  const data = await socialService.listComments(postId, pagination, ctx.state.auth?.userId);
  ctx.body = success(data);
}

export async function createComment(ctx: HttpContext): Promise<void> {
  const authorId = ctx.state.auth!.userId;
  const postId = ctx.params.id;
  const body = ctx.request.body as { content?: string; imageUrls?: string[]; parentId?: string };

  const data = await socialService.createComment(authorId, {
    postId,
    content: body.content ?? '',
    imageUrls: body.imageUrls,
    parentId: body.parentId,
  });

  ctx.body = success(data);
}

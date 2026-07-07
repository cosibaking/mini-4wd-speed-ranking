import { requireLogin } from '../../services/auth';
import {
  createComment,
  getPost,
  listComments,
  toggleFollow,
  toggleLike,
} from '../../services/community';
import { chooseAndUploadImage, UploadCancelledError } from '../../services/media';
import type { CommentItem, CommentReplyTo, PostDetail } from '../../types';
import {
  normalizeUrlList,
  resolveDisplayImageUrls,
} from '../../utils/mediaUrl';

function updateCommentLike(
  comments: CommentItem[],
  id: string,
  liked: boolean,
  likeCount: number,
): CommentItem[] {
  return comments.map((item) =>
    item.id === id ? { ...item, liked, likeCount } : item,
  );
}

async function withCommentDisplayImages(
  comments: CommentItem[],
  force = false,
): Promise<CommentItem[]> {
  return Promise.all(
    comments.map(async (comment) => {
      const imageUrls = normalizeUrlList(comment.imageUrls ?? comment.images);
      return {
        ...comment,
        imageUrls,
        images: await resolveDisplayImageUrls(imageUrls, force),
      };
    }),
  );
}

Page({
  data: {
    post: null as PostDetail | null,
    comments: [] as CommentItem[],
    commentText: '',
    commentImages: [] as string[],
    commentImagePreviews: [] as string[],
    replyTo: null as CommentReplyTo | null,
    loading: true,
  },

  /** chooseMedia 返回后微信可能清理临时文件，需在 onShow 中刷新评论图片 */
  _pendingCommentImageRefresh: false,
  _postId: '',

  onLoad(options: { id?: string }) {
    if (options.id) {
      this._postId = options.id;
      this.loadPost(options.id);
    }
  },

  onShow() {
    if (this._pendingCommentImageRefresh) {
      this._pendingCommentImageRefresh = false;
      void this.refreshImagePaths();
    }
  },

  async loadPost(id: string) {
    let post: PostDetail | null = null;
    let comments: CommentItem[] = [];
    try {
      post = await getPost(id);
    } catch {
      // 帖子加载失败时仍尝试加载评论
    }
    try {
      const commentRes = await listComments(id);
      comments = commentRes.list;
    } catch {
      // 评论加载失败不影响帖子展示
    }

    if (post) {
      post = {
        ...post,
        images: await resolveDisplayImageUrls(normalizeUrlList(post.images)),
      };
    }
    if (comments.length > 0) {
      comments = await withCommentDisplayImages(comments);
    }

    this.setData({ post, comments, loading: false });
  },

  async refreshImagePaths() {
    const updates: Partial<{
      comments: CommentItem[];
      commentImagePreviews: string[];
    }> = {};

    if (this.data.comments.length > 0) {
      updates.comments = await withCommentDisplayImages(this.data.comments, true);
    }
    if (this.data.commentImages.length > 0) {
      updates.commentImagePreviews = await resolveDisplayImageUrls(
        this.data.commentImages,
        true,
      );
    }

    if (Object.keys(updates).length > 0) {
      this.setData(updates);
    }
  },

  async onLike() {
    const post = this.data.post;
    if (!post) return;
    try {
      await requireLogin();
    } catch {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    try {
      const res = await toggleLike({ type: 'post', id: post.id });
      this.setData({
        'post.liked': res.liked,
        'post.likeCount': res.likeCount,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败';
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  async onFollow() {
    const post = this.data.post;
    if (!post) return;
    try {
      await requireLogin();
    } catch {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    try {
      const res = await toggleFollow(post.author.id);
      this.setData({ 'post.followingAuthor': res.following });
      wx.showToast({ title: res.following ? '已关注' : '已取消', icon: 'none' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败';
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  async onCommentLike(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    try {
      await requireLogin();
    } catch {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    try {
      const res = await toggleLike({ type: 'comment', id });
      this.setData({
        comments: updateCommentLike(this.data.comments, id, res.liked, res.likeCount),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作失败';
      wx.showToast({ title: msg, icon: 'none' });
    }
  },

  onCommentReply(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const nickName = e.currentTarget.dataset.nickname as string;
    if (!id || !nickName) return;
    this.setData({ replyTo: { id, nickName } });
  },

  onOpenUser(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    if (!id) return;
    wx.navigateTo({ url: `/pages/user/detail?id=${id}` });
  },

  onCancelReply() {
    this.setData({ replyTo: null });
  },

  onCommentInput(e: WechatMiniprogram.Input) {
    this.setData({ commentText: e.detail.value });
  },

  onPreviewPostImage(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string;
    const urls = this.data.post?.images || [];
    if (!url || urls.length === 0) return;
    wx.previewImage({ urls, current: url });
  },

  onPreviewCommentImage(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number;
    const commentId = e.currentTarget.dataset.commentId as string;
    const comment = this.data.comments.find((item) => item.id === commentId);
    const urls = normalizeUrlList(comment?.imageUrls ?? comment?.images);
    if (!urls.length) return;
    wx.previewImage({ urls, current: urls[index] ?? urls[0] });
  },

  async onAddCommentImage() {
    if (this.data.commentImages.length >= 9) {
      wx.showToast({ title: '最多9张', icon: 'none' });
      return;
    }
    this._pendingCommentImageRefresh = true;
    try {
      wx.showLoading({ title: '上传中' });
      const urls = await chooseAndUploadImage(
        'comment_image',
        9 - this.data.commentImages.length,
      );
      const commentImages = [...this.data.commentImages, ...urls];
      const commentImagePreviews = await resolveDisplayImageUrls(commentImages, true);
      this.setData({ commentImages, commentImagePreviews });
      await this.refreshImagePaths();
      this._pendingCommentImageRefresh = false;
    } catch (err) {
      if (!(err instanceof UploadCancelledError)) {
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    } finally {
      wx.hideLoading();
    }
  },

  async onSendComment() {
    const text = this.data.commentText.trim();
    const images = this.data.commentImages;
    const post = this.data.post;
    const replyTo = this.data.replyTo;
    if ((!text && images.length === 0) || !post) return;
    try {
      await requireLogin();
      await createComment(post.id, {
        content: text,
        images,
        parentId: replyTo?.id,
      });
      const commentRes = await listComments(post.id);
      const comments = await withCommentDisplayImages(commentRes.list);
      this.setData({
        comments,
        commentText: '',
        commentImages: [],
        commentImagePreviews: [],
        replyTo: null,
        'post.commentCount': post.commentCount + 1,
      });
    } catch {
      wx.showToast({ title: '评论失败', icon: 'none' });
    }
  },

  onShare() {
    // 由 onShareAppMessage 处理
  },

  onShareAppMessage() {
    const post = this.data.post;
    return {
      title: post?.title || '社区帖子',
      path: `/pages/community/post?id=${post?.id}`,
      imageUrl: post?.images?.[0],
    };
  },

  onShareTimeline() {
    const post = this.data.post;
    return {
      title: post?.title || '社区帖子',
      query: `id=${post?.id}`,
      imageUrl: post?.images?.[0],
    };
  },

  async onPullDownRefresh() {
    try {
      if (this._postId) {
        await this.loadPost(this._postId);
      }
    } finally {
      wx.stopPullDownRefresh();
    }
  },
});

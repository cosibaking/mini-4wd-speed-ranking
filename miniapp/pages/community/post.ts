import { ensureLogin } from '../../services/auth';
import {
  createComment,
  getPost,
  listComments,
  toggleFollow,
  toggleLike,
} from '../../services/community';
import type { CommentItem, PostDetail } from '../../types';

Page({
  data: {
    post: null as PostDetail | null,
    comments: [] as CommentItem[],
    commentText: '',
    loading: true,
  },

  onLoad(options: { id?: string }) {
    if (options.id) this.loadPost(options.id);
  },

  async loadPost(id: string) {
    try {
      const [post, commentRes] = await Promise.all([
        getPost(id),
        listComments(id),
      ]);
      this.setData({ post, comments: commentRes.list, loading: false });
    } catch {
      this.setData({ loading: false });
    }
  },

  async onLike() {
    const post = this.data.post;
    if (!post) return;
    try {
      await ensureLogin();
      const res = await toggleLike({ type: 'post', id: post.id });
      this.setData({
        'post.liked': res.liked,
        'post.likeCount': res.likeCount,
      });
    } catch {
      wx.showToast({ title: '请先登录', icon: 'none' });
    }
  },

  async onFollow() {
    const post = this.data.post;
    if (!post) return;
    try {
      await ensureLogin();
      const res = await toggleFollow(post.author.id);
      this.setData({ 'post.followingAuthor': res.following });
      wx.showToast({ title: res.following ? '已关注' : '已取消', icon: 'none' });
    } catch {
      wx.showToast({ title: '请先登录', icon: 'none' });
    }
  },

  onCommentInput(e: WechatMiniprogram.Input) {
    this.setData({ commentText: e.detail.value });
  },

  async onSendComment() {
    const text = this.data.commentText.trim();
    const post = this.data.post;
    if (!text || !post) return;
    try {
      await ensureLogin();
      const comment = await createComment(post.id, text);
      this.setData({
        comments: [...this.data.comments, comment],
        commentText: '',
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
    };
  },
});

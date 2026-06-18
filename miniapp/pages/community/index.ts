import { listBoards, listPosts } from '../../services/community';
import type { Board, PostListItem } from '../../types';

Page({
  data: {
    boards: [] as Board[],
    activeBoardId: '',
    posts: [] as PostListItem[],
    sort: 'latest' as 'latest' | 'hot',
    loading: true,
    hasMore: false,
    page: 1,
  },

  onLoad() {
    this.init();
  },

  async init() {
    try {
      const boards = await listBoards();
      const activeBoardId = boards[0]?.id || '';
      this.setData({ boards, activeBoardId });
      if (activeBoardId) await this.loadPosts(true);
      else this.setData({ loading: false });
    } catch {
      this.setData({ loading: false });
    }
  },

  async loadPosts(reset = false) {
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    try {
      const res = await listPosts({
        boardId: this.data.activeBoardId,
        sort: this.data.sort,
        page,
        pageSize: 20,
      });
      const posts = reset ? res.list : [...this.data.posts, ...res.list];
      this.setData({
        posts,
        hasMore: res.hasMore,
        page: page + 1,
        loading: false,
      });
    } catch {
      this.setData({ loading: false });
    }
  },

  onBoardTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    this.setData({ activeBoardId: id });
    this.loadPosts(true);
  },

  onSortTap(e: WechatMiniprogram.TouchEvent) {
    const sort = e.currentTarget.dataset.sort as 'latest' | 'hot';
    this.setData({ sort });
    this.loadPosts(true);
  },

  onCreatePost() {
    wx.navigateTo({ url: '/pages/community/create' });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPosts(false);
    }
  },
});

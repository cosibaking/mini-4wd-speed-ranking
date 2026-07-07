import { listBoards, listPosts } from '../../services/community';
import type { Board, PostListItem } from '../../types';
import { resolveDisplayImageUrl } from '../../utils/mediaUrl';

Page({
  _skipNextTabRefresh: false,

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
    this._skipNextTabRefresh = true;
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
    const boardId = this.data.activeBoardId;
    if (!boardId) {
      this.setData({ loading: false, posts: reset ? [] : this.data.posts });
      return;
    }
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });
    try {
      const res = await listPosts({
        boardId,
        sort: this.data.sort,
        page,
        pageSize: 20,
      });
      const resolvedList = await Promise.all(
        res.list.map(async (item) => {
          if (!item.coverImage) return item;
          return {
            ...item,
            coverImage: await resolveDisplayImageUrl(item.coverImage),
          };
        }),
      );
      const posts = reset ? resolvedList : [...this.data.posts, ...resolvedList];
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
    if (!id) return;
    this.setData({ activeBoardId: id }, () => this.loadPosts(true));
  },

  onSortTap(e: WechatMiniprogram.TouchEvent) {
    const sort = e.currentTarget.dataset.sort as 'latest' | 'hot';
    this.setData({ sort }, () => this.loadPosts(true));
  },

  onCreatePost() {
    wx.navigateTo({ url: '/pages/community/create' });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPosts(false);
    }
  },

  async refreshPage() {
    if (this.data.activeBoardId) {
      await this.loadPosts(true);
    } else {
      await this.init();
    }
  },

  onTabItemTap() {
    if (this._skipNextTabRefresh) {
      this._skipNextTabRefresh = false;
      return;
    }
    void this.refreshPage();
  },

  async onPullDownRefresh() {
    try {
      await this.refreshPage();
    } finally {
      wx.stopPullDownRefresh();
    }
  },
});

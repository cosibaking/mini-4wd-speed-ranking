import {
  deleteAdminPost,
  getAdminUserDetail,
  listAdminPosts,
  restoreAdminPost,
} from '../../../services/admin';
import type { AdminPostItem, AdminUserDetail } from '../../../services/admin';

Page({
  data: {
    user: null as AdminUserDetail | null,
    posts: [] as AdminPostItem[],
    postsLoading: true,
  },

  _userId: '',

  onLoad(options: { id?: string }) {
    if (options.id) {
      this._userId = options.id;
      this.loadUser(options.id);
      this.loadPosts(options.id);
    }
  },

  async loadUser(id: string) {
    try {
      const user = await getAdminUserDetail(id);
      this.setData({ user });
    } catch {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  async loadPosts(authorId: string) {
    this.setData({ postsLoading: true });
    try {
      const res = await listAdminPosts({ authorId, pageSize: 100 });
      this.setData({ posts: res.list, postsLoading: false });
    } catch {
      this.setData({ postsLoading: false });
    }
  },

  onOpenPost(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/admin/pages/posts/detail?id=${id}` });
  },

  onDelete(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '删除帖子',
      content: '删除后用户将无法看到该帖子，可随时恢复。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await deleteAdminPost(id);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadPosts(this._userId);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },

  onRestore(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.showModal({
      title: '恢复帖子',
      content: '确认恢复该帖子？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await restoreAdminPost(id);
          wx.showToast({ title: '已恢复', icon: 'success' });
          this.loadPosts(this._userId);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },
});

import {
  deleteAdminPost,
  getAdminPost,
  restoreAdminPost,
} from '../../../services/admin';
import type { AdminPostDetail } from '../../../services/admin';
import { normalizeUrlList, resolveDisplayImageUrls } from '../../../utils/mediaUrl';

Page({
  data: {
    post: null as AdminPostDetail | null,
    images: [] as string[],
  },

  _postId: '',

  onLoad(options: { id?: string }) {
    if (options.id) {
      this._postId = options.id;
      this.loadPost(options.id);
    }
  },

  async loadPost(id: string) {
    try {
      const post = await getAdminPost(id);
      const imageUrls = normalizeUrlList(post.imageUrls);
      const images = await resolveDisplayImageUrls(imageUrls);
      this.setData({ post, images });
    } catch {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onOpenUser(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/admin/pages/users/detail?id=${id}` });
  },

  onPreviewImage(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string;
    const urls = this.data.images;
    if (!url || urls.length === 0) return;
    wx.previewImage({ urls, current: url });
  },

  onDelete() {
    wx.showModal({
      title: '删除帖子',
      content: '删除后用户将无法看到该帖子，可随时恢复。',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await deleteAdminPost(this._postId);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadPost(this._postId);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },

  onRestore() {
    wx.showModal({
      title: '恢复帖子',
      content: '确认恢复该帖子？',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await restoreAdminPost(this._postId);
          wx.showToast({ title: '已恢复', icon: 'success' });
          this.loadPost(this._postId);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '操作失败';
          wx.showToast({ title: msg, icon: 'none' });
        }
      },
    });
  },
});

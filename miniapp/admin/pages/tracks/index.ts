import { listAdminTracks } from '../../../services/admin';
import type { AdminTrackItem } from '../../../services/admin';

Page({
  data: {
    list: [] as AdminTrackItem[],
    loading: true,
  },

  onLoad() {
    this.loadList();
  },

  async loadList() {
    try {
      const res = await listAdminTracks({ pageSize: 100 });
      this.setData({ list: res.list, loading: false });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onOpen(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/track/detail?id=${id}` });
  },
});

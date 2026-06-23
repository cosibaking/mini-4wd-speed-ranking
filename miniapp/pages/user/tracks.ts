import { ensureLogin } from '../../services/auth';
import { getMyTracks } from '../../services/track';
import type { TrackListItem } from '../../types';

Page({
  data: {
    tracks: [] as TrackListItem[],
    loading: true,
    isOrganizer: false,
  },

  async onLoad() {
    const user = await ensureLogin();
    if (!user.isOrganizer) {
      wx.redirectTo({
        url: user.organizerApplication ? '/pages/organizer/status' : '/pages/organizer/apply',
      });
      return;
    }
    this.setData({ isOrganizer: true });
    this.loadTracks();
  },

  async loadTracks() {
    try {
      const res = await getMyTracks();
      this.setData({ tracks: res.list, loading: false });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/track/edit' });
  },

  onEdit(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.navigateTo({ url: `/pages/track/edit?id=${id}` });
  },
});

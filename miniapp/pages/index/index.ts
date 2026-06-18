import { ensureLogin } from '../../services/auth';
import { getRecentTracks, listTracks } from '../../services/track';
import type { TrackListItem } from '../../types';

Page({
  data: {
    recentTracks: [] as TrackListItem[],
    loading: true,
  },

  onShow() {
    this.loadRecent();
  },

  async loadRecent() {
    this.setData({ loading: true });
    try {
      let recent: TrackListItem[] = [];
      try {
        recent = await getRecentTracks();
      } catch {
        const res = await listTracks({ pageSize: 3 });
        recent = res.list.slice(0, 3);
      }
      this.setData({ recentTracks: recent, loading: false });
    } catch {
      this.setData({ loading: false });
    }
  },

  async onOrganizerTap() {
    try {
      await ensureLogin();
      wx.navigateTo({ url: '/pages/user/tracks' });
    } catch {
      wx.showToast({ title: '请先登录', icon: 'none' });
    }
  },

  onDriverTap() {
    wx.navigateTo({ url: '/pages/track/list' });
  },
});

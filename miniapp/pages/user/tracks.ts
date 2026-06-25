import { requireLogin } from '../../services/auth';
import { getTrackPendingCount } from '../../services/record';
import { getMyTracks } from '../../services/track';
import { guardLogin } from '../../utils/nav';
import type { TrackListItem } from '../../types';

interface TrackWithPending extends TrackListItem {
  pendingCount: number;
}

Page({
  data: {
    tracks: [] as TrackWithPending[],
    loading: true,
    isOrganizer: false,
  },

  async onLoad() {
    if (!(await guardLogin())) return;
    const user = await requireLogin();
    if (!user.isOrganizer) {
      wx.redirectTo({
        url: user.organizerApplication ? '/pages/organizer/status' : '/pages/organizer/apply',
      });
      return;
    }
    this.setData({ isOrganizer: true });
    this.loadTracks();
  },

  onShow() {
    if (this.data.isOrganizer) {
      this.loadTracks();
    }
  },

  async loadTracks() {
    try {
      const res = await getMyTracks();
      const tracks = await Promise.all(
        res.list.map(async (track) => {
          try {
            const { count } = await getTrackPendingCount(track.id);
            return { ...track, pendingCount: count };
          } catch {
            return { ...track, pendingCount: 0 };
          }
        }),
      );
      this.setData({ tracks, loading: false });
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

  onReview(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    const name = e.currentTarget.dataset.name as string;
    wx.navigateTo({
      url: `/pages/organizer/records?trackId=${id}&trackName=${encodeURIComponent(name)}`,
    });
  },
});

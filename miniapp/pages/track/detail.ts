import { getTrack, touchRecentVisit } from '../../services/track';
import { openNavigation } from '../../utils/geo';
import type { TrackDetail } from '../../types';

Page({
  data: {
    track: null as TrackDetail | null,
    loading: true,
  },

  onLoad(options: { id?: string }) {
    if (options.id) {
      this.loadTrack(options.id);
    }
  },

  async loadTrack(id: string) {
    this.setData({ loading: true });
    try {
      const track = await getTrack(id);
      this.setData({ track, loading: false });
      touchRecentVisit(id);
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onNavigate() {
    const track = this.data.track;
    if (!track) return;
    openNavigation(track.name, track.location.lat, track.location.lng, track.location.address);
  },

  onCopyContact() {
    const contact = this.data.track?.organizerContact;
    if (!contact) return;
    wx.setClipboardData({ data: contact });
  },

  onViewLeaderboard() {
    const id = this.data.track?.id;
    if (id) wx.navigateTo({ url: `/pages/leaderboard/index?trackId=${id}` });
  },

  onSubmitRecord() {
    const id = this.data.track?.id;
    if (id) wx.navigateTo({ url: `/pages/record/submit?trackId=${id}` });
  },
});

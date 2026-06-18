import { getLeaderboard } from '../../services/record';
import { listTracks } from '../../services/track';
import type { LeaderboardEntry, LeaderboardResult, TrackListItem } from '../../types';

Page({
  data: {
    trackId: '',
    trackName: '',
    tracks: [] as TrackListItem[],
    list: [] as LeaderboardEntry[],
    total: 0,
    myRank: undefined as LeaderboardResult['myRank'],
    loading: true,
    showPicker: false,
  },

  onLoad(options: { trackId?: string }) {
    this.init(options.trackId);
  },

  async init(trackId?: string) {
    try {
      const res = await listTracks({ pageSize: 50 });
      const tracks = res.list;
      const selectedId = trackId || tracks[0]?.id || '';
      this.setData({ tracks, trackId: selectedId });
      if (selectedId) {
        await this.loadLeaderboard(selectedId);
      } else {
        this.setData({ loading: false });
      }
    } catch {
      this.setData({ loading: false });
    }
  },

  async loadLeaderboard(trackId: string) {
    this.setData({ loading: true, trackId });
    try {
      const res = await getLeaderboard(trackId);
      this.setData({
        trackName: res.trackName,
        list: res.list,
        total: res.total,
        myRank: res.myRank,
        loading: false,
      });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onTogglePicker() {
    this.setData({ showPicker: !this.data.showPicker });
  },

  onSelectTrack(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    this.setData({ showPicker: false });
    this.loadLeaderboard(id);
  },

  onEmptyAction() {
    const trackId = this.data.trackId;
    if (trackId) {
      wx.navigateTo({ url: `/pages/record/submit?trackId=${trackId}` });
    } else {
      wx.navigateTo({ url: '/pages/track/list' });
    }
  },
});

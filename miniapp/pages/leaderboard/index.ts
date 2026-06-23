import { getLeaderboard } from '../../services/record';
import { listTracks } from '../../services/track';
import type { LeaderboardEntry, LeaderboardResult, TrackListItem } from '../../types';

const PENDING_TRACK_KEY = 'pending_leaderboard_track_id';

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
    const pendingTrackId = wx.getStorageSync(PENDING_TRACK_KEY) as string;
    if (pendingTrackId) {
      wx.removeStorageSync(PENDING_TRACK_KEY);
      this.init(pendingTrackId);
      return;
    }
    this.init(options.trackId);
  },

  onShow() {
    const pendingTrackId = wx.getStorageSync(PENDING_TRACK_KEY) as string;
    if (!pendingTrackId) return;
    wx.removeStorageSync(PENDING_TRACK_KEY);
    this.loadLeaderboard(pendingTrackId);
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

  onUpload() {
    wx.navigateTo({ url: `/pages/record/submit?trackId=${this.data.trackId}` });
  },
});

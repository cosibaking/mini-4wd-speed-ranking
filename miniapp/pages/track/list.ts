import { listTracks } from '../../services/track';
import { getUserLocation } from '../../utils/geo';
import type { TrackListItem } from '../../types';

Page({
  data: {
    tracks: [] as TrackListItem[],
    keyword: '',
    loading: true,
    hasMore: false,
    page: 1,
  },

  onLoad() {
    this.loadTracks(true);
  },

  async loadTracks(reset = false) {
    const page = reset ? 1 : this.data.page;
    this.setData({ loading: true });

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const loc = await getUserLocation();
      lat = loc.lat;
      lng = loc.lng;
    } catch {
      // 定位失败仍可浏览列表
    }

    try {
      const res = await listTracks({
        page,
        pageSize: 20,
        lat,
        lng,
        keyword: this.data.keyword || undefined,
      });
      const tracks = reset ? res.list : [...this.data.tracks, ...res.list];
      this.setData({
        tracks,
        hasMore: res.hasMore,
        page: page + 1,
        loading: false,
      });
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadTracks(true);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTracks(false);
    }
  },

  onCreateTrack() {
    wx.navigateTo({ url: '/pages/track/edit' });
  },
});

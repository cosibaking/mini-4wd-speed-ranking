import { TENCENT_MAP_SUBKEY } from '../../config';
import { getTrack, touchRecentVisit } from '../../services/track';
import { buildTrackMarker, openMapNavigation } from '../../utils/geo';
import { switchToLeaderboard } from '../../utils/nav';
import type { MapMarker } from '../../utils/geo';
import type { TrackDetail } from '../../types';

Page({
  data: {
    track: null as TrackDetail | null,
    loading: true,
    detailExpanded: false,
    hasDetailContent: false,
    mapLatitude: 39.9042,
    mapLongitude: 116.4074,
    mapMarkers: [] as MapMarker[],
    mapSubkey: TENCENT_MAP_SUBKEY,
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
      const hasDetailContent = Boolean(
        track.lengthMeters ||
          track.floorPlanUrls.length > 0 ||
          track.exampleVideoUrl ||
          track.ruleNote
      );
      this.setData({
        track,
        loading: false,
        hasDetailContent,
        mapLatitude: track.location.lat,
        mapLongitude: track.location.lng,
        mapMarkers: [buildTrackMarker(track.location.lat, track.location.lng, track.name)],
      });
      touchRecentVisit(id);
    } catch {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onToggleDetail() {
    this.setData({ detailExpanded: !this.data.detailExpanded });
  },

  onPreviewFloorPlan(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string;
    const urls = this.data.track?.floorPlanUrls || [];
    if (!url || urls.length === 0) return;
    wx.previewImage({ urls, current: url });
  },

  onOpenMapNav() {
    const track = this.data.track;
    if (!track) return;
    openMapNavigation('trackMap', {
      name: track.name,
      lat: track.location.lat,
      lng: track.location.lng,
      address: track.location.address,
    });
  },

  onCopyContact() {
    const contact = this.data.track?.organizerContact;
    if (!contact) return;
    wx.setClipboardData({ data: contact });
  },

  onViewLeaderboard() {
    const id = this.data.track?.id;
    if (id) switchToLeaderboard(id);
  },

  onSubmitRecord() {
    const id = this.data.track?.id;
    if (id) wx.navigateTo({ url: `/pages/record/submit?trackId=${id}` });
  },
});

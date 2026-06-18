import { TENCENT_MAP_SUBKEY } from '../../config';
import { ensureLogin } from '../../services/auth';
import { createTrack, getTrack, updateTrack } from '../../services/track';
import { chooseAndUploadImage, chooseAndUploadVideo, UploadCancelledError } from '../../services/media';
import { getSessionUser } from '../../stores/session';
import {
  buildTrackMarker,
  DEFAULT_MAP_CENTER,
  getUserLocation,
  reverseGeocodeAddress,
} from '../../utils/geo';
import type { MapMarker } from '../../utils/geo';

interface FormData {
  name: string;
  location: { lat: number; lng: number; address: string } | null;
  organizerName: string;
  organizerContact: string;
  lengthMeters: string;
  floorPlanUrls: string[];
  exampleVideoUrl: string;
  ruleNote: string;
}

Page({
  data: {
    step: 1,
    trackId: '',
    isEdit: false,
    form: {
      name: '',
      location: null,
      organizerName: '',
      organizerContact: '',
      lengthMeters: '',
      floorPlanUrls: [],
      exampleVideoUrl: '',
      ruleNote: '',
    } as FormData,
    submitting: false,
    locationAddress: '',
    mapLatitude: DEFAULT_MAP_CENTER.latitude,
    mapLongitude: DEFAULT_MAP_CENTER.longitude,
    mapScale: 16,
    mapMarkers: [] as MapMarker[],
    mapSubkey: TENCENT_MAP_SUBKEY,
    resolvingAddress: false,
  },

  async onLoad(options: { id?: string }) {
    await ensureLogin();
    this.syncOrganizerName();

    if (options.id) {
      this.setData({ trackId: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑赛道' });
      const track = await getTrack(options.id);
      this.setData({
        form: {
          name: track.name,
          location: track.location,
          organizerName: getSessionUser()?.nickName || '微信用户',
          organizerContact: track.organizerContact || '',
          lengthMeters: track.lengthMeters ? String(track.lengthMeters) : '',
          floorPlanUrls: track.floorPlanUrls || [],
          exampleVideoUrl: track.exampleVideoUrl || '',
          ruleNote: track.ruleNote || '',
        },
        locationAddress: track.location?.address || '',
      });
      if (track.location) {
        this.updateMapView(track.location.lat, track.location.lng, track.name);
      }
      return;
    }

    try {
      const loc = await getUserLocation();
      this.updateMapView(loc.lat, loc.lng);
    } catch {
      // 定位失败时使用默认中心
    }
  },

  onShow() {
    this.syncOrganizerName();
  },

  syncOrganizerName() {
    const user = getSessionUser();
    this.setData({ 'form.organizerName': user?.nickName || '微信用户' });
  },

  updateMapView(lat: number, lng: number, title?: string) {
    const markers = title ? [buildTrackMarker(lat, lng, title)] : [];
    this.setData({
      mapLatitude: lat,
      mapLongitude: lng,
      mapMarkers: markers,
    });
  },

  onNameInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.name': e.detail.value });
  },

  onOrganizerContactInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.organizerContact': e.detail.value });
  },

  onLengthInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.lengthMeters': e.detail.value });
  },

  onRuleNoteInput(e: WechatMiniprogram.Input) {
    this.setData({ 'form.ruleNote': e.detail.value });
  },

  formatSelectedAddress(res: {
    name: string;
    address: string;
  }): string {
    const address = (res.address || '').trim();
    const name = (res.name || '').trim();
    if (address && name) {
      return address.includes(name) ? address : `${name} ${address}`;
    }
    return address || name;
  },

  isCoordinateLikeAddress(text: string): boolean {
    return /^地图选点/.test(text) || /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(text);
  },

  async applyLocation(lat: number, lng: number, addressHint?: string) {
    if (this.data.resolvingAddress) return;

    let address = (addressHint || '').trim();
    if (!address || this.isCoordinateLikeAddress(address)) {
      this.setData({ resolvingAddress: true });
      try {
        wx.showLoading({ title: '解析地址中' });
        address = await reverseGeocodeAddress(lat, lng);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '地址解析失败';
        wx.showToast({ title: msg, icon: 'none' });
        return;
      } finally {
        wx.hideLoading();
        this.setData({ resolvingAddress: false });
      }
    }

    if (!address || this.isCoordinateLikeAddress(address)) {
      wx.showToast({ title: '未能解析有效地址，请重试', icon: 'none' });
      return;
    }

    const title = this.data.form.name.trim() || '赛道位置';
    this.setData({
      locationAddress: address,
      'form.location': { lat, lng, address },
    });
    this.updateMapView(lat, lng, title);
  },

  onMapTap(e: WechatMiniprogram.MapTapEvent) {
    const { latitude, longitude } = e.detail;
    this.applyLocation(latitude, longitude);
  },

  onMapPoiTap(e: WechatMiniprogram.MapPoiTapEvent) {
    const { name, latitude, longitude } = e.detail;
    this.applyLocation(latitude, longitude, name);
  },

  onChooseLocation() {
    wx.chooseLocation({
      success: async (res) => {
        const address = this.formatSelectedAddress(res);
        await this.applyLocation(res.latitude, res.longitude, address);
      },
    });
  },

  async onAddFloorPlan() {
    const urls = this.data.form.floorPlanUrls;
    if (urls.length >= 3) {
      wx.showToast({ title: '最多3张', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '上传中' });
      const uploaded = await chooseAndUploadImage('track_floor_plan', 3 - urls.length);
      this.setData({ 'form.floorPlanUrls': [...urls, ...uploaded] });
    } catch (err) {
      if (err instanceof UploadCancelledError) {
        return;
      }
      console.error('[track/edit] floor plan upload failed', err);
      const message = err instanceof Error ? err.message : '上传失败';
      wx.showToast({ title: message.slice(0, 20), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async onAddVideo() {
    try {
      wx.showLoading({ title: '上传中' });
      const url = await chooseAndUploadVideo('track_example_video');
      this.setData({ 'form.exampleVideoUrl': url });
    } catch (err) {
      console.error('[track/edit] video upload failed', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  validateStep1(): boolean {
    const { name, location, organizerName } = this.data.form;
    if (!name.trim()) {
      wx.showToast({ title: '请填写赛道名称', icon: 'none' });
      return false;
    }
    if (!location) {
      wx.showToast({ title: '请在地图上选择赛道位置', icon: 'none' });
      return false;
    }
    if (!organizerName.trim()) {
      wx.showToast({ title: '请填写主理人名称', icon: 'none' });
      return false;
    }
    return true;
  },

  onNext() {
    if (this.data.step === 1 && !this.validateStep1()) return;
    if (this.data.step < 3) {
      this.setData({ step: this.data.step + 1 });
    }
  },

  onPrev() {
    if (this.data.step > 1) {
      this.setData({ step: this.data.step - 1 });
    }
  },

  async onSubmit() {
    if (!this.validateStep1()) {
      this.setData({ step: 1 });
      return;
    }

    const form = this.data.form;
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      location: form.location,
      organizerName: form.organizerName.trim(),
      organizerContact: form.organizerContact.trim() || undefined,
      floorPlanUrls: form.floorPlanUrls,
      exampleVideoUrl: form.exampleVideoUrl || undefined,
      ruleNote: form.ruleNote.trim() || undefined,
    };
    if (form.lengthMeters) {
      payload.lengthMeters = parseInt(form.lengthMeters, 10);
    }

    this.setData({ submitting: true });
    try {
      let track;
      if (this.data.isEdit) {
        track = await updateTrack(this.data.trackId, payload);
      } else {
        track = await createTrack(payload);
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/track/detail?id=${track.id}` });
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提交失败';
      wx.showToast({ title: msg, icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});

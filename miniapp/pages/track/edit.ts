import { TENCENT_MAP_SUBKEY } from '../../config';
import { requireLogin } from '../../services/auth';
import { createTrack, getTrack, updateTrack } from '../../services/track';
import { chooseAndUploadImage, chooseAndUploadVideo, UploadCancelledError } from '../../services/media';
import { getSessionUser } from '../../stores/session';
import { guardLogin } from '../../utils/nav';
import {
  buildTrackMarker,
  DEFAULT_MAP_CENTER,
  getUserLocation,
  reverseGeocodeAddress,
} from '../../utils/geo';
import type { MapMarker, PlaceSearchResult } from '../../utils/geo';

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
    locationRequestId: 0,
  },

  async onLoad(options: { id?: string }) {
    if (!(await guardLogin())) return;
    const user = await requireLogin();
    if (!user.isOrganizer) {
      wx.redirectTo({
        url: user.organizerApplication ? '/pages/organizer/status' : '/pages/organizer/apply',
      });
      return;
    }
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

  /** 直接写入已确定地址的选点（不再二次逆地理编码） */
  setSelectedLocation(lat: number, lng: number, address: string) {
    const requestId = this.data.locationRequestId + 1;
    const title = this.data.form.name.trim() || '赛道位置';
    this.setData({
      locationRequestId: requestId,
      locationAddress: address,
      mapLatitude: lat,
      mapLongitude: lng,
      mapMarkers: [buildTrackMarker(lat, lng, title)],
      'form.location': { lat, lng, address },
    });
  },

  /** 地图点选 / POI 点选：无现成地址，需逆地理编码解析 */
  async applyLocation(lat: number, lng: number, addressHint?: string) {
    const requestId = this.data.locationRequestId + 1;
    const hint = (addressHint || '').trim();
    const title = this.data.form.name.trim() || '赛道位置';

    this.setData({
      locationRequestId: requestId,
      locationAddress: hint || '正在解析地址...',
      mapLatitude: lat,
      mapLongitude: lng,
      mapMarkers: [buildTrackMarker(lat, lng, title)],
    });

    let loadingShown = false;
    try {
      if (!hint) {
        wx.showLoading({ title: '解析地址中' });
        loadingShown = true;
      }
      const resolved = await reverseGeocodeAddress(lat, lng);
      if (this.data.locationRequestId !== requestId) return;

      let address = resolved;
      if (hint && !this.isCoordinateLikeAddress(hint)) {
        address = resolved.includes(hint) ? resolved : `${hint}（${resolved}）`;
      }

      if (!address || this.isCoordinateLikeAddress(address)) {
        wx.showToast({ title: '未能解析有效地址，请重试', icon: 'none' });
        this.setData({ locationAddress: '' });
        return;
      }

      this.setData({
        locationAddress: address,
        'form.location': { lat, lng, address },
      });
    } catch (err: unknown) {
      if (this.data.locationRequestId !== requestId) return;
      const msg = err instanceof Error ? err.message : '地址解析失败';
      wx.showToast({ title: msg, icon: 'none' });
      this.setData({ locationAddress: hint || '' });
    } finally {
      if (loadingShown) {
        wx.hideLoading();
      }
    }
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
    const { mapLatitude, mapLongitude } = this.data;
    wx.navigateTo({
      url: `/pages/location/picker?lat=${mapLatitude}&lng=${mapLongitude}`,
      events: {
        selected: (place: PlaceSearchResult) => {
          const address = this.formatSelectedAddress({
            name: place.name,
            address: place.address,
          });
          if (address) {
            this.setSelectedLocation(place.lat, place.lng, address);
            return;
          }
          this.applyLocation(place.lat, place.lng, place.name);
        },
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
      if (err instanceof UploadCancelledError) {
        return;
      }
      console.error('[track/edit] video upload failed', err);
      const message = err instanceof Error ? err.message : '上传失败';
      wx.showToast({ title: message.slice(0, 20), icon: 'none' });
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
    if (!location || !location.address?.trim()) {
      wx.showToast({ title: '请在地图上选择赛道位置', icon: 'none' });
      return false;
    }
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      wx.showToast({ title: '位置坐标无效，请重新选点', icon: 'none' });
      return false;
    }
    if (!organizerName.trim()) {
      wx.showToast({ title: '请填写主理人名称', icon: 'none' });
      return false;
    }
    return true;
  },

  validateStep2(): boolean {
    const raw = this.data.form.lengthMeters.trim();
    if (!raw) {
      return true;
    }
    const lengthMeters = parseInt(raw, 10);
    if (!Number.isFinite(lengthMeters) || lengthMeters < 1 || lengthMeters > 10000) {
      wx.showToast({ title: '赛道长度须为1-10000米', icon: 'none' });
      return false;
    }
    return true;
  },

  onNext() {
    if (this.data.step === 1 && !this.validateStep1()) return;
    if (this.data.step === 2 && !this.validateStep2()) return;
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
    if (!this.validateStep2()) {
      this.setData({ step: 2 });
      return;
    }

    const form = this.data.form;
    const loc = form.location!;
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      location: {
        lat: Number(loc.lat),
        lng: Number(loc.lng),
        address: loc.address.trim(),
      },
      organizerName: form.organizerName.trim(),
      organizerContact: form.organizerContact.trim() || undefined,
      floorPlanUrls: form.floorPlanUrls.filter(Boolean),
      exampleVideoUrl: form.exampleVideoUrl || undefined,
      ruleNote: form.ruleNote.trim() || undefined,
    };
    const lengthRaw = form.lengthMeters.trim();
    if (lengthRaw) {
      payload.lengthMeters = parseInt(lengthRaw, 10);
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

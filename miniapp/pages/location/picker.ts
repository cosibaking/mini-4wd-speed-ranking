import { TENCENT_MAP_SUBKEY } from '../../config';
import {
  buildTrackMarker,
  DEFAULT_MAP_CENTER,
  getUserLocation,
  reverseGeocodeAddress,
  searchPlacesByKeyword,
  suggestPlacesByKeyword,
} from '../../utils/geo';
import type { MapMarker, PlaceSearchResult } from '../../utils/geo';

const SUGGEST_DEBOUNCE_MS = 350;

Page({
  data: {
    keyword: '',
    results: [] as PlaceSearchResult[],
    selectedIndex: -1,
    searched: false,
    searching: false,
    searchError: '',
    mapLatitude: DEFAULT_MAP_CENTER.latitude,
    mapLongitude: DEFAULT_MAP_CENTER.longitude,
    mapScale: 16,
    mapMarkers: [] as MapMarker[],
    mapSubkey: TENCENT_MAP_SUBKEY,
  },

  suggestTimer: null as ReturnType<typeof setTimeout> | null,
  suggestRequestId: 0,

  async onLoad(options: { lat?: string; lng?: string }) {
    const lat = options.lat ? Number(options.lat) : NaN;
    const lng = options.lng ? Number(options.lng) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      this.setData({ mapLatitude: lat, mapLongitude: lng });
      return;
    }
    try {
      const loc = await getUserLocation();
      this.setData({ mapLatitude: loc.lat, mapLongitude: loc.lng });
    } catch {
      // 使用默认中心
    }
  },

  onUnload() {
    if (this.suggestTimer) {
      clearTimeout(this.suggestTimer);
      this.suggestTimer = null;
    }
  },

  onKeywordInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value;
    this.setData({ keyword, searchError: '' });
    if (this.suggestTimer) {
      clearTimeout(this.suggestTimer);
    }
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      this.setData({ results: [], selectedIndex: -1, searched: false });
      return;
    }
    this.suggestTimer = setTimeout(() => {
      this.fetchSuggestions(trimmed);
    }, SUGGEST_DEBOUNCE_MS);
  },

  async fetchSuggestions(keyword: string) {
    const requestId = ++this.suggestRequestId;
    const { mapLatitude, mapLongitude } = this.data;
    try {
      let list: PlaceSearchResult[] = [];
      try {
        list = await suggestPlacesByKeyword(keyword, mapLatitude, mapLongitude);
      } catch (suggestErr) {
        console.warn('[location/picker] 联想接口失败，回退完整搜索', suggestErr);
        list = await searchPlacesByKeyword(keyword, mapLatitude, mapLongitude);
      }
      if (requestId !== this.suggestRequestId) return;

      this.setData({
        results: list,
        selectedIndex: list.length > 0 ? 0 : -1,
        searched: true,
        searchError: list.length === 0 ? '未找到相关地点' : '',
      });
      if (list.length > 0) {
        this.applySelection(list[0], 0);
      }
    } catch (err) {
      if (requestId !== this.suggestRequestId) return;
      const msg = this.formatError(err);
      console.error('[location/picker] 联想失败', err);
      this.setData({
        results: [],
        selectedIndex: -1,
        searched: true,
        searchError: msg,
      });
    }
  },

  formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'errMsg' in err) {
      return String((err as { errMsg: string }).errMsg);
    }
    return '搜索失败，请检查网络';
  },

  async onSearch() {
    const keyword = this.data.keyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    if (this.data.searching) return;

    this.suggestRequestId += 1;
    this.setData({ searching: true, searchError: '' });
    const { mapLatitude, mapLongitude } = this.data;

    try {
      wx.showLoading({ title: '搜索中' });
      const list = await searchPlacesByKeyword(keyword, mapLatitude, mapLongitude);
      this.setData({
        results: list,
        selectedIndex: list.length > 0 ? 0 : -1,
        searched: true,
        searchError: list.length === 0 ? '未找到相关地点' : '',
      });
      if (list.length > 0) {
        this.applySelection(list[0], 0);
      }
    } catch (err) {
      const msg = this.formatError(err);
      console.error('[location/picker] 搜索失败', err);
      wx.showToast({ title: msg.slice(0, 20), icon: 'none' });
      this.setData({
        results: [],
        selectedIndex: -1,
        searched: true,
        searchError: msg,
      });
    } finally {
      wx.hideLoading();
      this.setData({ searching: false });
    }
  },

  applySelection(place: PlaceSearchResult, index: number) {
    this.setData({
      selectedIndex: index,
      mapLatitude: place.lat,
      mapLongitude: place.lng,
      mapMarkers: [buildTrackMarker(place.lat, place.lng, place.name)],
    });
  },

  onSelectResult(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index);
    const place = this.data.results[index];
    if (!place) return;
    this.applySelection(place, index);
  },

  async resolveMapPoint(lat: number, lng: number, nameHint?: string) {
    if (nameHint) {
      try {
        const list = await searchPlacesByKeyword(nameHint, lat, lng);
        if (list.length > 0) {
          const place = list[0];
          this.setData({
            results: list,
            selectedIndex: 0,
            searched: true,
            searchError: '',
          });
          this.applySelection(place, 0);
          return;
        }
      } catch {
        // 回退逆地理编码
      }
    }

    try {
      wx.showLoading({ title: '解析地址中' });
      const address = await reverseGeocodeAddress(lat, lng);
      const place: PlaceSearchResult = {
        name: nameHint || address,
        address,
        lat,
        lng,
      };
      this.setData({
        results: [place],
        selectedIndex: 0,
        searched: true,
        searchError: '',
      });
      this.applySelection(place, 0);
    } catch (err) {
      const msg = this.formatError(err);
      wx.showToast({ title: msg.slice(0, 20), icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onMapTap(e: WechatMiniprogram.MapTapEvent) {
    const { latitude, longitude } = e.detail;
    this.resolveMapPoint(latitude, longitude);
  },

  onMapPoiTap(e: WechatMiniprogram.MapPoiTapEvent) {
    const { name, latitude, longitude } = e.detail;
    this.resolveMapPoint(latitude, longitude, name);
  },

  onCancel() {
    wx.navigateBack();
  },

  onConfirm() {
    const place = this.data.results[this.data.selectedIndex];
    if (!place) {
      wx.showToast({ title: '请先选择位置', icon: 'none' });
      return;
    }
    const channel = this.getOpenerEventChannel();
    channel.emit('selected', place);
    wx.navigateBack();
  },
});

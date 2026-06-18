"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const geo_1 = require("../../utils/geo");
const SUGGEST_DEBOUNCE_MS = 350;
Page({
    data: {
        keyword: '',
        results: [],
        selectedIndex: -1,
        searched: false,
        searching: false,
        searchError: '',
        mapLatitude: geo_1.DEFAULT_MAP_CENTER.latitude,
        mapLongitude: geo_1.DEFAULT_MAP_CENTER.longitude,
        mapScale: 16,
        mapMarkers: [],
        mapSubkey: config_1.TENCENT_MAP_SUBKEY,
    },
    suggestTimer: null,
    suggestRequestId: 0,
    async onLoad(options) {
        const lat = options.lat ? Number(options.lat) : NaN;
        const lng = options.lng ? Number(options.lng) : NaN;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
            this.setData({ mapLatitude: lat, mapLongitude: lng });
            return;
        }
        try {
            const loc = await (0, geo_1.getUserLocation)();
            this.setData({ mapLatitude: loc.lat, mapLongitude: loc.lng });
        }
        catch (_a) {
            // 使用默认中心
        }
    },
    onUnload() {
        if (this.suggestTimer) {
            clearTimeout(this.suggestTimer);
            this.suggestTimer = null;
        }
    },
    onKeywordInput(e) {
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
    async fetchSuggestions(keyword) {
        const requestId = ++this.suggestRequestId;
        const { mapLatitude, mapLongitude } = this.data;
        try {
            let list = [];
            try {
                list = await (0, geo_1.suggestPlacesByKeyword)(keyword, mapLatitude, mapLongitude);
            }
            catch (suggestErr) {
                console.warn('[location/picker] 联想接口失败，回退完整搜索', suggestErr);
                list = await (0, geo_1.searchPlacesByKeyword)(keyword, mapLatitude, mapLongitude);
            }
            if (requestId !== this.suggestRequestId)
                return;
            this.setData({
                results: list,
                selectedIndex: list.length > 0 ? 0 : -1,
                searched: true,
                searchError: list.length === 0 ? '未找到相关地点' : '',
            });
            if (list.length > 0) {
                this.applySelection(list[0], 0);
            }
        }
        catch (err) {
            if (requestId !== this.suggestRequestId)
                return;
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
    formatError(err) {
        if (err instanceof Error)
            return err.message;
        if (typeof err === 'object' && err && 'errMsg' in err) {
            return String(err.errMsg);
        }
        return '搜索失败，请检查网络';
    },
    async onSearch() {
        const keyword = this.data.keyword.trim();
        if (!keyword) {
            wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
            return;
        }
        if (this.data.searching)
            return;
        this.suggestRequestId += 1;
        this.setData({ searching: true, searchError: '' });
        const { mapLatitude, mapLongitude } = this.data;
        try {
            wx.showLoading({ title: '搜索中' });
            const list = await (0, geo_1.searchPlacesByKeyword)(keyword, mapLatitude, mapLongitude);
            this.setData({
                results: list,
                selectedIndex: list.length > 0 ? 0 : -1,
                searched: true,
                searchError: list.length === 0 ? '未找到相关地点' : '',
            });
            if (list.length > 0) {
                this.applySelection(list[0], 0);
            }
        }
        catch (err) {
            const msg = this.formatError(err);
            console.error('[location/picker] 搜索失败', err);
            wx.showToast({ title: msg.slice(0, 20), icon: 'none' });
            this.setData({
                results: [],
                selectedIndex: -1,
                searched: true,
                searchError: msg,
            });
        }
        finally {
            wx.hideLoading();
            this.setData({ searching: false });
        }
    },
    applySelection(place, index) {
        this.setData({
            selectedIndex: index,
            mapLatitude: place.lat,
            mapLongitude: place.lng,
            mapMarkers: [(0, geo_1.buildTrackMarker)(place.lat, place.lng, place.name)],
        });
    },
    onSelectResult(e) {
        const index = Number(e.currentTarget.dataset.index);
        const place = this.data.results[index];
        if (!place)
            return;
        this.applySelection(place, index);
    },
    async resolveMapPoint(lat, lng, nameHint) {
        if (nameHint) {
            try {
                const list = await (0, geo_1.searchPlacesByKeyword)(nameHint, lat, lng);
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
            }
            catch (_a) {
                // 回退逆地理编码
            }
        }
        try {
            wx.showLoading({ title: '解析地址中' });
            const address = await (0, geo_1.reverseGeocodeAddress)(lat, lng);
            const place = {
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
        }
        catch (err) {
            const msg = this.formatError(err);
            wx.showToast({ title: msg.slice(0, 20), icon: 'none' });
        }
        finally {
            wx.hideLoading();
        }
    },
    onMapTap(e) {
        const { latitude, longitude } = e.detail;
        this.resolveMapPoint(latitude, longitude);
    },
    onMapPoiTap(e) {
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

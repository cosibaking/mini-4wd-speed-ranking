"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const track_1 = require("../../services/track");
const geo_1 = require("../../utils/geo");
Page({
    data: {
        tracks: [],
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
        const loc = await (0, geo_1.tryGetUserLocation)();
        const lat = loc === null || loc === void 0 ? void 0 : loc.lat;
        const lng = loc === null || loc === void 0 ? void 0 : loc.lng;
        try {
            const res = await (0, track_1.listTracks)({
                page,
                pageSize: 20,
                lat,
                lng,
                sort: lat !== undefined && lng !== undefined ? 'distance' : undefined,
                keyword: this.data.keyword || undefined,
            });
            const tracks = reset ? res.list : [...this.data.tracks, ...res.list];
            this.setData({
                tracks,
                hasMore: res.hasMore,
                page: page + 1,
                loading: false,
            });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onSearchInput(e) {
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

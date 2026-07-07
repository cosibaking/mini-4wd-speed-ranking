"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../config");
const track_1 = require("../../services/track");
const geo_1 = require("../../utils/geo");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        track: null,
        loading: true,
        detailExpanded: false,
        hasDetailContent: false,
        mapLatitude: 39.9042,
        mapLongitude: 116.4074,
        mapMarkers: [],
        mapSubkey: config_1.TENCENT_MAP_SUBKEY,
    },
    onLoad(options) {
        if (options.id) {
            this.loadTrack(options.id);
        }
    },
    async loadTrack(id) {
        this.setData({ loading: true });
        try {
            const track = await (0, track_1.getTrack)(id);
            const hasDetailContent = Boolean(track.lengthMeters ||
                track.floorPlanUrls.length > 0 ||
                track.exampleVideoUrl ||
                track.ruleNote);
            this.setData({
                track,
                loading: false,
                hasDetailContent,
                mapLatitude: track.location.lat,
                mapLongitude: track.location.lng,
                mapMarkers: [(0, geo_1.buildTrackMarker)(track.location.lat, track.location.lng, track.name)],
            });
            (0, track_1.touchRecentVisit)(id);
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onToggleDetail() {
        this.setData({ detailExpanded: !this.data.detailExpanded });
    },
    onPreviewFloorPlan(e) {
        var _a;
        const url = e.currentTarget.dataset.url;
        const urls = ((_a = this.data.track) === null || _a === void 0 ? void 0 : _a.floorPlanUrls) || [];
        if (!url || urls.length === 0)
            return;
        wx.previewImage({ urls, current: url });
    },
    onOpenMapNav() {
        const track = this.data.track;
        if (!track)
            return;
        (0, geo_1.openMapNavigation)('trackMap', {
            name: track.name,
            lat: track.location.lat,
            lng: track.location.lng,
            address: track.location.address,
        });
    },
    onCopyContact() {
        var _a;
        const contact = (_a = this.data.track) === null || _a === void 0 ? void 0 : _a.organizerContact;
        if (!contact)
            return;
        wx.setClipboardData({ data: contact });
    },
    onViewLeaderboard() {
        var _a;
        const id = (_a = this.data.track) === null || _a === void 0 ? void 0 : _a.id;
        if (id)
            (0, nav_1.switchToLeaderboard)(id);
    },
    onSubmitRecord() {
        var _a;
        const id = (_a = this.data.track) === null || _a === void 0 ? void 0 : _a.id;
        if (id)
            wx.navigateTo({ url: `/pages/record/submit?trackId=${id}` });
    },
    onShareAppMessage() {
        const track = this.data.track;
        if (!track) {
            return { title: '公园四驱·圈速打榜', path: '/pages/index/index' };
        }
        const recordHint = track.recordCount ? `，${track.recordCount} 人入榜` : '';
        return {
            title: `【${track.name}】公园四驱圈速赛道${recordHint}`,
            path: `/pages/track/detail?id=${track.id}`,
            imageUrl: track.floorPlanUrls[0],
        };
    },
    onShareTimeline() {
        const track = this.data.track;
        if (!track) {
            return { title: '公园四驱·圈速打榜' };
        }
        return {
            title: `【${track.name}】公园四驱圈速赛道`,
            query: `id=${track.id}`,
            imageUrl: track.floorPlanUrls[0],
        };
    },
});

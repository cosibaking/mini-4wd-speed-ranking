"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const record_1 = require("../../services/record");
const track_1 = require("../../services/track");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        trackId: '',
        trackName: '',
        tracks: [],
        list: [],
        total: 0,
        myRank: undefined,
        pendingReviewCount: 0,
        loading: true,
        showPicker: false,
    },
    onLoad(options) {
        const pendingTrackId = wx.getStorageSync(nav_1.PENDING_LEADERBOARD_TRACK_KEY);
        if (pendingTrackId) {
            wx.removeStorageSync(nav_1.PENDING_LEADERBOARD_TRACK_KEY);
            this.init(pendingTrackId);
            return;
        }
        this.init(options.trackId);
    },
    onShow() {
        const pendingTrackId = wx.getStorageSync(nav_1.PENDING_LEADERBOARD_TRACK_KEY);
        if (!pendingTrackId)
            return;
        wx.removeStorageSync(nav_1.PENDING_LEADERBOARD_TRACK_KEY);
        this.loadLeaderboard(pendingTrackId);
    },
    async init(trackId) {
        var _a;
        try {
            const res = await (0, track_1.listTracks)({ pageSize: 50 });
            const tracks = res.list;
            const selectedId = trackId || ((_a = tracks[0]) === null || _a === void 0 ? void 0 : _a.id) || '';
            this.setData({ tracks, trackId: selectedId });
            if (selectedId) {
                await this.loadLeaderboard(selectedId);
            }
            else {
                this.setData({ loading: false });
            }
        }
        catch (_b) {
            this.setData({ loading: false });
        }
    },
    async loadLeaderboard(trackId) {
        var _a;
        this.setData({ loading: true, trackId });
        try {
            const res = await (0, record_1.getLeaderboard)(trackId);
            this.setData({
                trackName: res.trackName,
                list: res.list,
                total: res.total,
                myRank: res.myRank,
                pendingReviewCount: (_a = res.pendingReviewCount) !== null && _a !== void 0 ? _a : 0,
                loading: false,
            });
        }
        catch (_b) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onTogglePicker() {
        this.setData({ showPicker: !this.data.showPicker });
    },
    onSelectTrack(e) {
        const id = e.currentTarget.dataset.id;
        this.setData({ showPicker: false });
        this.loadLeaderboard(id);
    },
    onUpload() {
        wx.navigateTo({ url: `/pages/record/submit?trackId=${this.data.trackId}` });
    },
});

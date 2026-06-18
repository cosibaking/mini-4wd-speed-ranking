"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const record_1 = require("../../services/record");
const track_1 = require("../../services/track");
Page({
    data: {
        trackId: '',
        trackName: '',
        tracks: [],
        list: [],
        total: 0,
        myRank: undefined,
        loading: true,
        showPicker: false,
    },
    onLoad(options) {
        this.init(options.trackId);
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
        this.setData({ loading: true, trackId });
        try {
            const res = await (0, record_1.getLeaderboard)(trackId);
            this.setData({
                trackName: res.trackName,
                list: res.list,
                total: res.total,
                myRank: res.myRank,
                loading: false,
            });
        }
        catch (_a) {
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
    onEmptyAction() {
        const trackId = this.data.trackId;
        if (trackId) {
            wx.navigateTo({ url: `/pages/record/submit?trackId=${trackId}` });
        }
        else {
            wx.navigateTo({ url: '/pages/track/list' });
        }
    },
});

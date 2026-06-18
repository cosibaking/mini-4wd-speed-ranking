"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const track_1 = require("../../services/track");
Page({
    data: {
        tracks: [],
        loading: true,
    },
    async onLoad() {
        await (0, auth_1.ensureLogin)();
        this.loadTracks();
    },
    async loadTracks() {
        try {
            const res = await (0, track_1.getMyTracks)();
            this.setData({ tracks: res.list, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onCreate() {
        wx.navigateTo({ url: '/pages/track/edit' });
    },
    onEdit(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/track/edit?id=${id}` });
    },
});

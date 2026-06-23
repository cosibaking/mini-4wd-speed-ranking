"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const track_1 = require("../../services/track");
Page({
    data: {
        tracks: [],
        loading: true,
        isOrganizer: false,
    },
    async onLoad() {
        const user = await (0, auth_1.ensureLogin)();
        if (!user.isOrganizer) {
            wx.redirectTo({
                url: user.organizerApplication ? '/pages/organizer/status' : '/pages/organizer/apply',
            });
            return;
        }
        this.setData({ isOrganizer: true });
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

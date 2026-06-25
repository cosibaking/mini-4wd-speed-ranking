"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const record_1 = require("../../services/record");
const track_1 = require("../../services/track");
const nav_1 = require("../../utils/nav");
Page({
    data: {
        tracks: [],
        loading: true,
        isOrganizer: false,
    },
    async onLoad() {
        if (!(await (0, nav_1.guardLogin)()))
            return;
        const user = await (0, auth_1.requireLogin)();
        if (!user.isOrganizer) {
            wx.redirectTo({
                url: user.organizerApplication ? '/pages/organizer/status' : '/pages/organizer/apply',
            });
            return;
        }
        this.setData({ isOrganizer: true });
        this.loadTracks();
    },
    onShow() {
        if (this.data.isOrganizer) {
            this.loadTracks();
        }
    },
    async loadTracks() {
        try {
            const res = await (0, track_1.getMyTracks)();
            const tracks = await Promise.all(res.list.map(async (track) => {
                try {
                    const { count } = await (0, record_1.getTrackPendingCount)(track.id);
                    return { ...track, pendingCount: count };
                }
                catch (_a) {
                    return { ...track, pendingCount: 0 };
                }
            }));
            this.setData({ tracks, loading: false });
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
    onReview(e) {
        const id = e.currentTarget.dataset.id;
        const name = e.currentTarget.dataset.name;
        wx.navigateTo({
            url: `/pages/organizer/records?trackId=${id}&trackName=${encodeURIComponent(name)}`,
        });
    },
});

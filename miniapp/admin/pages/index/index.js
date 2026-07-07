"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../../services/auth");
const admin_1 = require("../../../services/admin");
Page({
    data: {
        stats: null,
    },
    async onLoad() {
        const user = await (0, auth_1.requireLogin)();
        if (!user.isAdmin) {
            wx.showToast({ title: '无管理权限', icon: 'none' });
            setTimeout(() => wx.navigateBack(), 800);
            return;
        }
        this.loadStats();
    },
    onShow() {
        if (this.data.stats !== null) {
            this.loadStats();
        }
    },
    async loadStats() {
        try {
            const stats = await (0, admin_1.getAdminDashboard)();
            this.setData({ stats });
        }
        catch (_a) {
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onApplications() {
        wx.navigateTo({ url: '/admin/pages/applications/index' });
    },
    onTracks() {
        wx.navigateTo({ url: '/admin/pages/tracks/index' });
    },
    onUsers() {
        wx.navigateTo({ url: '/admin/pages/users/index' });
    },
    onMessages() {
        wx.navigateTo({ url: '/admin/pages/messages/index' });
    },
    onPosts() {
        wx.navigateTo({ url: '/admin/pages/posts/index' });
    },
});

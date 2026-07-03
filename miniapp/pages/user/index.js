"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../../services/admin");
const auth_1 = require("../../services/auth");
const notification_1 = require("../../services/notification");
const session_1 = require("../../stores/session");
const TAB_INDEX_USER = 3;
Page({
    data: {
        user: null,
        loggedIn: false,
        unreadCount: 0,
        adminHasPending: false,
        loggingIn: false,
    },
    onShow() {
        this.loadUser();
    },
    async refreshAdminBadge() {
        const { user, loggedIn } = this.data;
        if (!loggedIn || !(user === null || user === void 0 ? void 0 : user.isAdmin)) {
            this.setData({ adminHasPending: false });
            return;
        }
        try {
            const stats = await (0, admin_1.getAdminDashboard)();
            this.setData({ adminHasPending: stats.pendingApplications > 0 });
        }
        catch (_a) {
        }
    },
    async refreshUnreadBadge() {
        if (!this.data.loggedIn) {
            this.setData({ unreadCount: 0 });
            wx.removeTabBarBadge({ index: TAB_INDEX_USER });
            return;
        }
        try {
            const { count } = await (0, notification_1.getUnreadNotificationCount)();
            this.setData({ unreadCount: count });
            if (count > 0) {
                wx.setTabBarBadge({
                    index: TAB_INDEX_USER,
                    text: count > 99 ? '99+' : String(count),
                });
            }
            else {
                wx.removeTabBarBadge({ index: TAB_INDEX_USER });
            }
        }
        catch (_a) {
        }
    },
    async loadUser() {
        try {
            const user = await (0, auth_1.refreshUser)();
            if (user) {
                this.setData({ user, loggedIn: true });
                await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
                return;
            }
            const cached = (0, session_1.getSessionUser)();
            this.setData({
                user: cached,
                loggedIn: false,
                unreadCount: 0,
                adminHasPending: false,
            });
            wx.removeTabBarBadge({ index: TAB_INDEX_USER });
        }
        catch (_a) {
            this.setData({ user: null, loggedIn: false, unreadCount: 0, adminHasPending: false });
            wx.removeTabBarBadge({ index: TAB_INDEX_USER });
        }
    },
    async onLogin() {
        if (this.data.loggingIn)
            return;
        let profile = null;
        try {
            profile = await (0, auth_1.getUserProfile)();
        }
        catch (_a) {
            profile = null;
        }
        this.setData({ loggingIn: true });
        wx.showLoading({ title: '登录中...', mask: true });
        try {
            const result = await (0, auth_1.login)();
            let user = result.user;
            if (profile) {
                try {
                    user = await (0, auth_1.updateMe)({
                        nickName: profile.nickName,
                        avatarUrl: profile.avatarUrl,
                    });
                }
                catch (_b) {
                }
            }
            (0, session_1.setSessionUser)(user);
            this.setData({ user, loggedIn: true });
            await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
            wx.showToast({ title: '登录成功', icon: 'success' });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : '登录失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
        finally {
            this.setData({ loggingIn: false });
            wx.hideLoading();
        }
    },
    onLogout() {
        wx.showModal({
            title: '退出登录',
            content: '确定要退出当前账号吗？',
            confirmText: '退出',
            confirmColor: '#e64340',
            success: (res) => {
                if (!res.confirm)
                    return;
                (0, auth_1.logout)();
                this.setData({ user: null, loggedIn: false, unreadCount: 0, adminHasPending: false });
                wx.removeTabBarBadge({ index: TAB_INDEX_USER });
                wx.showToast({ title: '已退出登录', icon: 'none' });
            },
        });
    },
    onEditProfile() {
        if (!this.data.loggedIn)
            return;
        wx.navigateTo({ url: '/pages/user/profile' });
    },
    onNav(e) {
        const url = e.currentTarget.dataset.url;
        if (!this.data.loggedIn) {
            wx.showModal({
                title: '需要登录',
                content: '请先登录后再继续',
                confirmText: '去登录',
                cancelText: '取消',
            });
            return;
        }
        wx.navigateTo({ url });
    },
});

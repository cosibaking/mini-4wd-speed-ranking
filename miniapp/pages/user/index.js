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
            // ignore badge errors
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
            // ignore badge errors
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
            if (cached) {
                this.setData({ user: cached, loggedIn: true });
                await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
                return;
            }
            const loggedInUser = await (0, auth_1.ensureLogin)();
            (0, session_1.setSessionUser)(loggedInUser);
            this.setData({ user: loggedInUser, loggedIn: true });
            await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
        }
        catch (_a) {
            this.setData({ user: null, loggedIn: false, unreadCount: 0, adminHasPending: false });
            wx.removeTabBarBadge({ index: TAB_INDEX_USER });
        }
    },
    async onLogin() {
        try {
            const user = await (0, auth_1.ensureLogin)();
            try {
                const profile = await (0, auth_1.getUserProfile)();
                const updated = await (0, auth_1.updateMe)({
                    nickName: profile.nickName,
                    avatarUrl: profile.avatarUrl,
                });
                (0, session_1.setSessionUser)(updated);
                this.setData({ user: updated, loggedIn: true });
                await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
            }
            catch (_a) {
                (0, session_1.setSessionUser)(user);
                this.setData({ user, loggedIn: true });
                await Promise.all([this.refreshUnreadBadge(), this.refreshAdminBadge()]);
            }
        }
        catch (_b) {
            wx.showToast({ title: '登录失败', icon: 'none' });
        }
    },
    onEditProfile() {
        if (!this.data.loggedIn)
            return;
        wx.navigateTo({ url: '/pages/user/profile' });
    },
    onNav(e) {
        const url = e.currentTarget.dataset.url;
        if (!this.data.loggedIn) {
            this.onLogin().then(() => {
                if (this.data.loggedIn)
                    wx.navigateTo({ url });
            });
            return;
        }
        wx.navigateTo({ url });
    },
});

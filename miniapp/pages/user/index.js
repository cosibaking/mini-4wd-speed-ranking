"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const session_1 = require("../../stores/session");
Page({
    data: {
        user: null,
        loggedIn: false,
    },
    onShow() {
        this.loadUser();
    },
    async loadUser() {
        const cached = (0, session_1.getSessionUser)();
        if (cached) {
            this.setData({ user: cached, loggedIn: true });
            return;
        }
        try {
            const user = await (0, auth_1.ensureLogin)();
            (0, session_1.setSessionUser)(user);
            this.setData({ user, loggedIn: true });
        }
        catch (_a) {
            this.setData({ loggedIn: false });
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
            }
            catch (_a) {
                (0, session_1.setSessionUser)(user);
                this.setData({ user, loggedIn: true });
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

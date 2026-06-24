"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const community_1 = require("../../services/community");
const session_1 = require("../../stores/session");
Page({
    data: {
        user: null,
        isSelf: false,
        following: undefined,
        followLoading: false,
        loading: true,
    },
    onLoad(options) {
        if (options.id)
            this.loadUser(options.id);
        else
            this.setData({ loading: false });
    },
    async loadUser(id) {
        try {
            const user = await (0, auth_1.getUser)(id);
            const sessionUser = (0, session_1.getSessionUser)();
            const isSelf = (sessionUser === null || sessionUser === void 0 ? void 0 : sessionUser.id) === user.id;
            this.setData({
                user,
                isSelf,
                following: user.following,
                loading: false,
            });
        }
        catch (_a) {
            this.setData({ user: null, loading: false });
        }
    },
    async onToggleFollow() {
        const user = this.data.user;
        if (!user)
            return;
        try {
            await (0, auth_1.ensureLogin)();
        }
        catch (_a) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        if (this.data.followLoading)
            return;
        this.setData({ followLoading: true });
        try {
            const res = await (0, community_1.toggleFollow)(user.id);
            this.setData({ following: res.following, followLoading: false });
            wx.showToast({ title: res.following ? '已关注' : '已取消', icon: 'none' });
        }
        catch (err) {
            this.setData({ followLoading: false });
            const msg = err instanceof Error ? err.message : '操作失败';
            wx.showToast({ title: msg, icon: 'none' });
        }
    },
    onEditProfile() {
        wx.navigateTo({ url: '/pages/user/profile' });
    },
});

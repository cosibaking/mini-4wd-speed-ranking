"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../../services/auth");
const community_1 = require("../../services/community");
const session_1 = require("../../stores/session");
const mediaUrl_1 = require("../../utils/mediaUrl");
Page({
    data: {
        user: null,
        isSelf: false,
        following: undefined,
        followLoading: false,
        loading: true,
        posts: [],
        postsLoading: false,
        postsHasMore: false,
        postsPage: 1,
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
            await this.loadPosts(true);
        }
        catch (_a) {
            this.setData({ user: null, loading: false });
        }
    },
    async loadPosts(reset = false) {
        const user = this.data.user;
        if (!user)
            return;
        const page = reset ? 1 : this.data.postsPage;
        this.setData({ postsLoading: true });
        try {
            const res = await (0, community_1.listUserPosts)(user.id, { page, pageSize: 20 });
            const resolvedList = await Promise.all(res.list.map(async (item) => {
                if (!item.coverImage)
                    return item;
                return {
                    ...item,
                    coverImage: await (0, mediaUrl_1.resolveDisplayImageUrl)(item.coverImage),
                };
            }));
            const posts = reset ? resolvedList : [...this.data.posts, ...resolvedList];
            this.setData({
                posts,
                postsHasMore: res.hasMore,
                postsPage: page + 1,
                postsLoading: false,
            });
        }
        catch (_a) {
            this.setData({ postsLoading: false });
        }
    },
    async onToggleFollow() {
        var _a;
        const user = this.data.user;
        if (!user)
            return;
        try {
            await (0, auth_1.requireLogin)();
        }
        catch (_b) {
            wx.showToast({ title: '请先登录', icon: 'none' });
            return;
        }
        if (this.data.followLoading)
            return;
        this.setData({ followLoading: true });
        try {
            const res = await (0, community_1.toggleFollow)(user.id);
            const followerDelta = res.following ? 1 : -1;
            this.setData({
                following: res.following,
                followLoading: false,
                'user.followerCount': Math.max(0, ((_a = user.followerCount) !== null && _a !== void 0 ? _a : 0) + followerDelta),
            });
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
    onReachBottom() {
        if (this.data.postsHasMore && !this.data.postsLoading) {
            void this.loadPosts(false);
        }
    },
});

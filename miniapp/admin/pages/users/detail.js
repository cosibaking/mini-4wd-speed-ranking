"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../../../services/admin");
Page({
    data: {
        user: null,
        posts: [],
        postsLoading: true,
    },
    _userId: '',
    onLoad(options) {
        if (options.id) {
            this._userId = options.id;
            this.loadUser(options.id);
            this.loadPosts(options.id);
        }
    },
    async loadUser(id) {
        try {
            const user = await (0, admin_1.getAdminUserDetail)(id);
            this.setData({ user });
        }
        catch (_a) {
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    async loadPosts(authorId) {
        this.setData({ postsLoading: true });
        try {
            const res = await (0, admin_1.listAdminPosts)({ authorId, pageSize: 100 });
            this.setData({ posts: res.list, postsLoading: false });
        }
        catch (_a) {
            this.setData({ postsLoading: false });
        }
    },
    onOpenPost(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/admin/pages/posts/detail?id=${id}` });
    },
    onDelete(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '删除帖子',
            content: '删除后用户将无法看到该帖子，可随时恢复。',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.deleteAdminPost)(id);
                    wx.showToast({ title: '已删除', icon: 'success' });
                    this.loadPosts(this._userId);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
    onRestore(e) {
        const id = e.currentTarget.dataset.id;
        wx.showModal({
            title: '恢复帖子',
            content: '确认恢复该帖子？',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.restoreAdminPost)(id);
                    wx.showToast({ title: '已恢复', icon: 'success' });
                    this.loadPosts(this._userId);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
});

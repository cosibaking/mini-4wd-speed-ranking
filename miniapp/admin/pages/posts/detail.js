"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../../../services/admin");
const mediaUrl_1 = require("../../../utils/mediaUrl");
Page({
    data: {
        post: null,
        images: [],
    },
    _postId: '',
    onLoad(options) {
        if (options.id) {
            this._postId = options.id;
            this.loadPost(options.id);
        }
    },
    async loadPost(id) {
        try {
            const post = await (0, admin_1.getAdminPost)(id);
            const imageUrls = (0, mediaUrl_1.normalizeUrlList)(post.imageUrls);
            const images = await (0, mediaUrl_1.resolveDisplayImageUrls)(imageUrls);
            this.setData({ post, images });
        }
        catch (_a) {
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onOpenUser(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/admin/pages/users/detail?id=${id}` });
    },
    onPreviewImage(e) {
        const url = e.currentTarget.dataset.url;
        const urls = this.data.images;
        if (!url || urls.length === 0)
            return;
        wx.previewImage({ urls, current: url });
    },
    onDelete() {
        wx.showModal({
            title: '删除帖子',
            content: '删除后用户将无法看到该帖子，可随时恢复。',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.deleteAdminPost)(this._postId);
                    wx.showToast({ title: '已删除', icon: 'success' });
                    this.loadPost(this._postId);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
    onRestore() {
        wx.showModal({
            title: '恢复帖子',
            content: '确认恢复该帖子？',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.restoreAdminPost)(this._postId);
                    wx.showToast({ title: '已恢复', icon: 'success' });
                    this.loadPost(this._postId);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
});

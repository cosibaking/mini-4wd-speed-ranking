"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../../../services/admin");
Page({
    data: {
        list: [],
        keyword: '',
        loading: true,
    },
    _searchTimer: null,
    onLoad() {
        this.loadList();
    },
    async loadList() {
        this.setData({ loading: true });
        try {
            const keyword = this.data.keyword.trim();
            const res = await (0, admin_1.listAdminPosts)({
                keyword: keyword || undefined,
                pageSize: 100,
            });
            this.setData({ list: res.list, loading: false });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onSearchInput(e) {
        const keyword = e.detail.value;
        this.setData({ keyword });
        if (this._searchTimer)
            clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => this.loadList(), 300);
    },
    onSearch() {
        this.loadList();
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
                    this.loadList();
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
                    this.loadList();
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
});

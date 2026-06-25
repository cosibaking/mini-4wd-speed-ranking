"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../../../services/admin");
function filterUsers(list, keyword) {
    const q = keyword.trim().toLowerCase();
    if (!q)
        return list;
    return list.filter((user) => {
        const name = (user.nickName || '微信用户').toLowerCase();
        return name.includes(q);
    });
}
Page({
    data: {
        allList: [],
        list: [],
        keyword: '',
        loading: true,
    },
    onLoad() {
        this.loadList();
    },
    onSendMessage(e) {
        const { id, name, avatar } = e.currentTarget.dataset;
        const query = [
            `userId=${encodeURIComponent(id)}`,
            `nickName=${encodeURIComponent(name || '微信用户')}`,
            `avatarUrl=${encodeURIComponent(avatar || '')}`,
        ].join('&');
        wx.navigateTo({ url: `/admin/pages/messages/index?${query}` });
    },
    async loadList() {
        try {
            const res = await (0, admin_1.listAdminUsers)({ pageSize: 100 });
            const allList = res.list;
            this.setData({
                allList,
                list: filterUsers(allList, this.data.keyword),
                loading: false,
            });
        }
        catch (_a) {
            this.setData({ loading: false });
            wx.showToast({ title: '加载失败', icon: 'none' });
        }
    },
    onSearchInput(e) {
        const keyword = e.detail.value;
        this.setData({
            keyword,
            list: filterUsers(this.data.allList, keyword),
        });
    },
    onGrant(e) {
        const userId = e.currentTarget.dataset.id;
        wx.showModal({
            title: '授予主理人',
            content: '确认该用户已完成线下核实？',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.grantOrganizer)(userId);
                    wx.showToast({ title: '已授予', icon: 'success' });
                    this.loadList();
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
    onRevoke(e) {
        const userId = e.currentTarget.dataset.id;
        wx.showModal({
            title: '撤销主理人',
            content: '撤销后用户将无法创建/编辑赛道。',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.revokeOrganizer)(userId);
                    wx.showToast({ title: '已撤销', icon: 'success' });
                    this.loadList();
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
    onGrantAdmin(e) {
        const userId = e.currentTarget.dataset.id;
        wx.showModal({
            title: '授予管理员',
            content: '确认授予该用户管理后台访问权限？',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.grantAdmin)(userId);
                    wx.showToast({ title: '已授予', icon: 'success' });
                    this.loadList();
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : '操作失败';
                    wx.showToast({ title: msg, icon: 'none' });
                }
            },
        });
    },
    onRevokeAdmin(e) {
        const userId = e.currentTarget.dataset.id;
        wx.showModal({
            title: '撤销管理员',
            content: '撤销后用户将无法访问管理后台。',
            success: async (res) => {
                if (!res.confirm)
                    return;
                try {
                    await (0, admin_1.revokeAdmin)(userId);
                    wx.showToast({ title: '已撤销', icon: 'success' });
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
